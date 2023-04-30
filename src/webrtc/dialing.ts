import {mLog} from "./log";
import {Peer} from "./peer";
import {SignalingMessage, SignalingType, WsSignaling} from "./signaling";
import {rtcConfig} from "./webrtc";
import {Subject} from "rxjs";
import {settings} from "cluster";

export interface PeerInfo {
    id: string
    sdp?: any | null
}

export interface Dialing {
    peer: Peer;

    cancel(): Promise<void>;

    onFail: (error: string) => void;
    onAccept: (accept: RtcDialog) => void;
    onReject: () => void;
}

export interface Incoming {
    peer: Peer;

    accept(): Promise<RtcDialog>;

    reject(): Promise<void>;

    cancelEvent: Subject<string>

    disposeEvent: Subject<string>
}

export interface RtcDialog {
    peer: Peer;

    openMedia(): Promise<MediaStream>;

    onRemoteTrack(c: (r: RTCTrackEvent) => void): void;

    onHangup: () => void;

    hangup(): Promise<void>;
}

export interface Media {
    localStream: MediaStream | null;
    remoteStream: MediaStream | null;
}

export class WsDialog implements RtcDialog {

    onHangup: () => void = () => {
    };
    peer: Peer;
    private signaling: WsSignaling;
    private readonly isDialer: boolean = false;
    private readonly removeMessageListener: () => void;

    constructor(peer: Peer, dialer: boolean, signaling: WsSignaling) {
        this.peer = peer;
        this.isDialer = dialer;
        this.signaling = signaling;
        this.removeMessageListener = this.signaling.addMessageListener((m: SignalingMessage) => {
            if (m.type === SignalingType.Hangup) {
                const peerInfo = m.content as PeerInfo
                if (peerInfo.id === this.peer.peerId) {
                    this.removeMessageListener()
                    this.onHangup();
                    this.closeConnection();
                }
            }
        })
        this.initConnection();
    }

    private initConnection() {
        if (this.isDialer) {
            this.peer.attachLocalStream()
                .then()
                .catch(e => {
                    mLog("dialing", "init conn err:" + JSON.stringify(e))
                });
        }
    }

    private closeConnection() {
        this.peer.close();
    }

    async openMedia(): Promise<MediaStream> {
        return await this.peer.attachLocalStream().then();
    }

    closeMediaStream() {
        this.peer.closeLocalStream();
    }

    onRemoteTrack(onTrack: (r: RTCTrackEvent) => void) {
        this.peer.onRemoteTrack = (r) => {
            onTrack(r)
        }
    }

    hangup(): Promise<void> {
        this.removeMessageListener()
        this.closeConnection()

        const p: PeerInfo = {
            id: this.signaling.myId!!
        }

        return this.signaling.sendSignaling(this.peer.peerId, SignalingType.Hangup, p);
    }
}

export class WsDialing implements Dialing {

    private readonly signaling: WsSignaling;
    private callTimer: NodeJS.Timer | null = null;
    private readonly myInfo: PeerInfo;
    private removeMessageListener: () => void = () => {
    }

    private disposed: boolean = false;

    private failCallback: (error: string) => void = () => {
    }

    onAccept: ((accept: RtcDialog) => void) = () => {
    };
    onReject: (() => void) = () => {
    };
    onFail: ((msg: string) => void) = () => {
    };

    peer: Peer;
    peerId: string;

    public static dial(peerId: string): Promise<Dialing> {
        if (!WsSignaling.getInstance().available()) {
            return Promise.reject("Signaling not available");
        }
        const d = new WsDialing(peerId, WsSignaling.getInstance());
        return d.dial();
    }

    constructor(peerId: string, s: WsSignaling) {
        this.peer = Peer.create({id: peerId}, true, rtcConfig, s);
        this.myInfo = {
            id: s.myId!!,
        };
        this.peerId = peerId;
        this.signaling = s;
    }

    public cancel(): Promise<void> {
        this.disposed = true
        this.peer.close();
        this.callTimer && clearInterval(this.callTimer!!);
        this.removeMessageListener()
        return this.signaling.sendSignaling(this.peerId, SignalingType.Cancel, this.myInfo)
    }

    async dial(): Promise<Dialing> {

        if (!this.signaling.available()) {
            return Promise.reject("Signaling not available");
        }
        mLog("WsDialing", "dial:" + this.peerId);

        this.removeMessageListener();
        this.removeMessageListener = this.signaling.addMessageListener((m: SignalingMessage) => {
            if (m.type === SignalingType.Accept) {
                this.receiveAccept(m);
            } else if (m.type === SignalingType.Reject) {
                this.receiveReject(m);
            }
        });

        this.callTimer = setInterval(() => {
            this.dialOnce();
        }, 1000);

        setTimeout(() => {
            if (!this.disposed) {
                this.cancel().then().catch()
                this.onFail("无人接听")
            }
        }, 10000);
        return this;
    }

    private receiveAccept(m: SignalingMessage) {
        mLog("WsDialing", "receive accept");
        const peerInfo = m.content as PeerInfo
        if (peerInfo.id === this.peerId) {
            this.disposed = true;
            this.callTimer && clearInterval(this.callTimer!!);
            this.removeMessageListener()
            const dialog = new WsDialog(this.peer, true, this.signaling)
            this.onAccept(dialog)
        }
    }

    private receiveReject(m: SignalingMessage) {
        mLog("WsDialing", "receive reject");
        const peerInfo = m.content as PeerInfo
        this.disposed = true
        if (peerInfo.id === this.peerId) {
            this.callTimer && clearInterval(this.callTimer!!);
            this.removeMessageListener()
            this.onReject()
        }
    }

    private dialOnce() {
        if (this.disposed) {
            this.callTimer && clearInterval(this.callTimer!!);
            this.removeMessageListener()
            return;
        }

        if (!this.signaling.available()) {
            this.callTimer && clearInterval(this.callTimer!!);
            this.removeMessageListener()
            this.failCallback("Signaling not available")
            return;
        }

        this.signaling.sendSignaling(this.peerId, SignalingType.Dialing, this.myInfo)
            .then(() => {

            }).catch(e => {
            this.cancel().then(r => {
            });
            this.failCallback(e.message)
        });

    }
}

export class WsIncoming implements Incoming {

    private readonly signaling: WsSignaling;
    private readonly removeMessageListener: () => void;
    private timeout: NodeJS.Timer | null = null;

    peerInfo: PeerInfo;

    peer: Peer;
    cancelEvent: Subject<string>= new Subject<string>();
    disposeEvent: Subject<string>= new Subject<string>();

    constructor(peer: PeerInfo, signaling: WsSignaling) {
        this.peerInfo = peer;
        this.peer = Peer.create(peer, false, rtcConfig, signaling);
        this.signaling = signaling;

        this.checkActive()

        this.removeMessageListener = signaling.addMessageListener((m: SignalingMessage) => {
            if (m.type === SignalingType.Dialing) {
                const peerInfo = m.content as PeerInfo
                if (peerInfo.id === this.peerInfo.id) {
                    this.checkActive()
                }
            } else if (m.type === SignalingType.Cancel) {
                const peerInfo = m.content as PeerInfo
                if (peerInfo.id === this.peerInfo.id) {
                    this.removeMessageListener()
                    this.timeout && clearInterval(this.timeout!!);
                    this.cancelEvent.next("cancel")
                    this.disposeEvent.next("cancel")
                    this.signaling.deleteIncoming(this.peerInfo.id)
                }
            }
        })
    }

    private checkActive() {
        this.timeout && clearInterval(this.timeout!!);

        this.timeout = setTimeout(() => {
            this.cancelEvent.next("cancel")
            this.disposeEvent.next("cancel")
            this.signaling.deleteIncoming(this.peerInfo.id)
            this.removeMessageListener()
        }, 2000);
    }

    async accept(): Promise<RtcDialog> {

        await this.peer.attachLocalStream()

        const myInfo: PeerInfo = {
            id: this.signaling.myId!!,
        };
        await this.signaling.sendSignaling(this.peerInfo.id, SignalingType.Accept, myInfo);
        this.removeMessageListener();
        this.timeout && clearInterval(this.timeout!!);

        this.disposeEvent.next("cancel")

        return new WsDialog(this.peer, false, this.signaling);
    }

    reject(): Promise<void> {
        this.removeMessageListener()
        this.timeout && clearInterval(this.timeout!!);
        this.signaling.deleteIncoming(this.peerInfo.id)

        return this.signaling.sendSignaling(this.peerInfo.id, SignalingType.Reject, {id: this.signaling.myId}).finally(() => {
            this.disposeEvent.next("cancel")
        })
    }
}