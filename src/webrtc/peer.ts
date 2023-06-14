import { PeerInfo } from './dialing';
import { mLog } from './log';
import {
    DspMessage,
    Signaling,
    SignalingMessage,
    SignalingType,
    WsSignaling,
} from './signaling';

export class Peer {
    connection: RTCPeerConnection;
    remoteStream: ReadonlyArray<MediaStream> | null = null;
    localStream: MediaStream | null = null;
    private signaling: Signaling;
    private dialer: boolean = false;
    peerId: string;

    peerInfo: PeerInfo | null = null;

    private remoteStreamId: string | null = null;

    onRemoteTrack: (track: RTCTrackEvent) => void = () => {};
    onLocalMediaReady: (m: MediaStream) => void = () => {};

    private constructor(
        peerId: string,
        config: RTCConfiguration,
        signaling: Signaling
    ) {
        this.signaling = signaling;
        this.peerId = peerId;
        this.connection = new RTCPeerConnection(config);
    }

    public static create(
        peerInfo: PeerInfo,
        dialer: boolean,
        config: RTCConfiguration,
        signaling: Signaling
    ): Peer {
        const peer = new Peer(peerInfo.id, config, signaling);
        peer.dialer = dialer;
        peer.init();
        mLog('peer', 'create peer: ' + peerInfo.id);
        return peer;
    }

    private init() {
        this.connection.onnegotiationneeded = (ev: Event) => {
            mLog('peer', 'on negotiation needed:' + JSON.stringify(ev));
            if (this.dialer) {
                this.sendOffer();
            }
        };
        this.connection.onsignalingstatechange = (ev: Event) => {
            mLog(
                'peer',
                'on signaling state change: ' + this.connection!.signalingState
            );
        };
        this.connection.onconnectionstatechange = (ev: Event) => {
            mLog(
                'peer',
                'on connection state change: ' +
                    this.connection!.connectionState
            );
        };
        this.connection.onicegatheringstatechange = (ev: Event) => {
            mLog(
                'peer',
                'on ice gathering state change: ' +
                    this.connection!.iceGatheringState
            );
        };
        this.connection.onicecandidateerror = (ev: Event) => {
            console.log('on ice candidate error', ev);
            mLog('peer', 'on ice candidate error:' + JSON.stringify(ev));
        };
        this.connection.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
            mLog('peer', 'onicecandidate: ' + event.type);
            this.signaling.sendSignaling(
                this.peerId,
                SignalingType.RtcCandidate,
                {
                    id: this.peerId,
                    candidate: event.candidate,
                }
            );
        };
        this.connection.ontrack = (event: RTCTrackEvent) => {
            mLog('peer', ' ontrack:' + JSON.stringify(event));
            console.log('peer track settings:', event.track.getSettings());
            //console.log("peer track constraints:", event.track.getConstraints());
            //console.log("peer track label:", event.track.label);
            console.log('peer track kind:', event.track.kind);
            console.log('peer track id:', event.track.id);
            //console.log("peer track ready state:", event.track.readyState);
            //console.log("peer streams: ", event.streams.length);
            this.remoteStream = event.streams;

            this.onRemoteTrack(event);

            event.track.onunmute = () => {
                mLog('peer', 'onunmute: ' + JSON.stringify(event));
            };
        };

        this.signaling.addMessageListener((msg: SignalingMessage) => {
            switch (msg.type) {
                case SignalingType.RtcOffer:
                    const offer: DspMessage = msg.content;
                    mLog('peer', 'on offer: ' + offer.peerId);
                    if (offer.peerId !== this.peerId) {
                        return;
                    }
                    this.sendAnswer(offer.sdp)
                        .then(() => {
                            mLog('peer', 'send answer success');
                        })
                        .then((e) => {
                            mLog('peer', 'send answer error ' + e);
                        });
                    break;
                case SignalingType.RtcAnswer:
                    const answer: DspMessage = msg.content;
                    mLog('peer', 'on answer: ' + answer.peerId);
                    if (answer.peerId !== this.peerId) {
                        return;
                    }
                    this.onAnswer(answer.sdp);
                    break;
                case SignalingType.RtcCandidate:
                    if (msg.content.id !== this.peerId) {
                        return;
                    }
                    const candidate = msg.content.candidate;
                    this.connection
                        .addIceCandidate(candidate)
                        .then(() => {
                            mLog('peer', 'addIceCandidate success');
                        })
                        .catch((error) => {
                            mLog('peer', 'Error adding ice candidate:' + error);
                        });
                    break;
            }
        });
    }

    public async attachLocalStream(): Promise<MediaStream> {
        if (this.localStream !== null && this.localStream.active) {
            // this.addStream(this.localStream);
            mLog('peer', 'local stream already active');
            return Promise.resolve(this.localStream);
        } else {
            const stream_1 = await navigator.mediaDevices.getUserMedia({
                video: this.dialer,
                audio: !this.dialer,
            });
            // const stream_1 = await navigator.mediaDevices.getUserMedia({ video: m, audio: !m });
            this.localStream = stream_1;
            this.onLocalMediaReady(stream_1);
            this.addStream(stream_1);
            mLog('peer', 'add local stream');
            return stream_1;
        }
    }

    public close() {
        mLog('peer', 'close');
        (this.signaling as WsSignaling).deleteIncoming(this.peerId);

        if (this.remoteStream !== null) {
            this.remoteStream.forEach((stream) => {
                stream.getTracks().forEach((track) => {
                    track.stop();
                });
            });
        }
        this.closeLocalStream();
        this.connection.getSenders().forEach((sender) => {
            sender.track?.stop();
        });
        this.connection.getReceivers().forEach((receiver) => {
            receiver.track?.stop();
        });
        this.connection.close();
    }

    public closeLocalStream() {
        if (this.localStream !== null) {
            this.localStream.getTracks().forEach((track) => {
                track.stop();
            });
        }
    }

    public onAnswer(answer: RTCSessionDescriptionInit) {
        this.connection!.setRemoteDescription(answer)
            .then(() => {
                mLog('peer', 'onAnswer setRemoteDescription success');
            })
            .catch((error) => {
                mLog('peer', 'Error setting remote description:' + error);
            });
    }

    public async sendAnswer(remote: RTCSessionDescriptionInit) {
        mLog('peer', 'sendAnswer');
        await this.connection!.setRemoteDescription(remote);
        this.attachLocalStream().then();
        this.connection!.createAnswer()
            .then((answer) => {
                this.connection!.setLocalDescription(answer);
                const cnt: DspMessage = {
                    peerId: this.signaling.myId!!,
                    sdp: answer,
                };
                return this.signaling.sendSignaling(
                    this.peerId,
                    SignalingType.RtcAnswer,
                    cnt
                );
            })
            .then(() => {
                mLog('peer', 'sendAnswer success');
            })
            .catch((error) => {
                mLog('peer', 'Error creating answer:' + error);
            });
    }

    public sendOffer() {
        mLog('peer', 'sendOffer');
        this.connection
            .createOffer()
            .then(async (offer) => {
                await this.connection.setLocalDescription(offer);
                const cnt: DspMessage = {
                    peerId: this.signaling.myId!!,
                    sdp: offer,
                };
                return this.signaling.sendSignaling(
                    this.peerId,
                    SignalingType.RtcOffer,
                    cnt
                );
            })
            .then(() => {
                mLog('peer', 'sendOffer success');
            })
            .catch((error) => {
                mLog('peer', 'Error creating offer:' + JSON.stringify(error));
            });
    }

    public addStream(stream: MediaStream) {
        stream.getTracks().forEach((track: MediaStreamTrack) => {
            this.connection.addTrack(track, stream);
        });
    }
}
