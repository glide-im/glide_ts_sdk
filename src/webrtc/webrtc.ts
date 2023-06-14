import { Dialing, Incoming, PeerInfo, WsDialing } from './dialing';
import { Signaling, WsSignaling } from './signaling';

export let iceServer: RTCIceServer[] = [
    {
        urls: 'stun:openrelay.metered.ca:80',
    },
    {
        urls: 'turn:openrelay.metered.ca:80',
        username: 'openrelayproject',
        credential: 'openrelayproject',
    },
];

export let rtcConfig: RTCConfiguration = {
    iceServers: iceServer,
    iceCandidatePoolSize: 10,
    bundlePolicy: 'max-compat',
    rtcpMuxPolicy: 'require',
};

export function setRtcConfig(c: RTCConfiguration) {
    rtcConfig = c;
}

export type WebRtcSessionState = 'idle' | 'incoming' | 'dialing' | 'connected';

export class WebRTC {
    public static incoming: Incoming | null = null;

    public static getSignaling(): Signaling {
        return WsSignaling.getInstance();
    }

    public static dial(peerId: string): Promise<Dialing> {
        return WsDialing.dial(peerId);
    }

    public static onIncoming(
        cb: (peerInfo: PeerInfo, incoming: Incoming) => void
    ) {
        WebRTC.getSignaling().onIncoming = (
            peerInfo: PeerInfo,
            incoming: Incoming
        ) => {
            incoming.disposeEvent.subscribe(() => {
                WebRTC.incoming = null;
            });
            WebRTC.incoming = incoming;
            cb(peerInfo, incoming);
            // (incoming as WsIncoming).event.subscribe(() => {
            //     WebRTC.incoming = null
            // })
        };
    }
}
