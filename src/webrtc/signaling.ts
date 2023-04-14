import {Incoming, PeerInfo, WsIncoming} from "./dialing";
import {mLog} from "./log";
import {Ws} from "../im/ws";
import {Account} from "../im/account";
import {Actions, MessageType} from "../im/message";
import {firstValueFrom} from "rxjs";

export enum SignalingType {
    Hi = 2000,
    Hello = 2001,

    Dialing = 2002,
    Accept = 2003,
    Reject = 2004,
    Hangup = 2005,
    Cancel = 2006,

    RtcOffer = 2007,
    RtcAnswer = 2008,
    RtcIce = 2009,
    RtcClose = 2010,
    RtcCandidate = 2011,
}

interface Message {
    action: string;
    data: any | null;
    seq: number;
    from: string | null;
    to: string | null;
}

export interface SignalingMessage {
    type: number;
    content: any;
}

export interface DspMessage {
    peerId: string;
    sdp: any;
}

interface Hello {
    server_version: string | null;
    temp_id: string | null;
    heartbeat_interval: number | null;
}

export interface Signaling {
    myId: string | null;

    available(): boolean;

    onIncoming: (peerInfo: PeerInfo, incoming: Incoming) => void;

    sendSignaling(to: string, type: SignalingType, content: any): Promise<any>

    addMessageListener(l: (m: SignalingMessage) => void): () => void
}

export class WsSignaling implements Signaling {

    private messageListeners: ((m: SignalingMessage) => void)[] = [];
    private incomingList = new Map<string, Incoming>();

    myId: string | null = null;

    onIncoming: (peerInfo: PeerInfo, incoming: Incoming) => void = () => {
    }
    onHelloCallback: (id: string, replay: boolean) => void = () => {
    }
    logCallback: (message: string) => void = () => {
    };

    private static instance: WsSignaling;

    public static getInstance(): WsSignaling {
        if (!WsSignaling.instance) {
            WsSignaling.instance = new WsSignaling();
        }
        return WsSignaling.instance;
    }

    constructor() {

        Ws.addMessageListener((message) => {
            if (message.action === Actions.MessageCli) {
                this.onSignalingMessage(message.data as SignalingMessage)
            }
        })
    }

    available(): boolean {
        this.myId = Account.getInstance().getUID();
        return Ws.isConnected() && this.myId !== null;
    }

    addMessageListener(l: (m: SignalingMessage) => void): () => void {
        this.messageListeners.push(l);
        return () => {
            this.messageListeners = this.messageListeners.filter(x => x !== l);
        }
    }

    public helloToFriend(id: string, replay: boolean = false) {
        this.sendSignaling(id, replay ? SignalingType.Hello : SignalingType.Hi, this.myId!!).then();
    }

    public async sendSignaling(to: string, type: SignalingType, content: any): Promise<any> {
        this.myId = Account.getInstance().getUID();
        const m = {
            content: content, from: this.myId, id: 0, to: to, type: type.valueOf(),
        };
        return firstValueFrom(Ws.sendCliCustomMessage(m))
    }

    deleteIncoming(peerId: string) {
        if (this.incomingList.has(peerId)) {
            this.incomingList.delete(peerId);
        }
    }

    private onSignalingMessage(msg: SignalingMessage) {

        if (msg.type >= 2000 && msg.type <= 2011) {
            mLog("signaling", JSON.stringify(msg));
        } else {
            return
        }
        this.messageListeners.forEach(l => l(msg));

        switch (msg.type) {
            case SignalingType.Hi:
                this.helloToFriend(msg.content, true);
                this.onHelloCallback(msg.content, false)
                break;
            case SignalingType.Hello:
                this.onHelloCallback(msg.content, true)
                break;
            case SignalingType.Dialing:
                const peer = msg.content as PeerInfo;
                if (!this.incomingList.has(peer.id)) {
                    const incoming = new WsIncoming(peer, this);
                    this.incomingList.set(peer.id, incoming);
                    this.onIncoming(peer, incoming);
                }
        }
    }
}