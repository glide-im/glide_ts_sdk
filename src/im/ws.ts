import { ThreeSixty } from "@mui/icons-material";
import { map, mergeMap, Observable, Observer, TimeoutError, timeout as timeoutOpt } from "rxjs";
import { AckMessage, AckNotify, AckRequest, Actions, CommonMessage, Message } from "./message";

export type Listener = (msg: CommonMessage<any>) => void

export type StateListener = (state: State, msg: string) => void

export enum State {
    CONNECTED,
    CONNECTING,
    CLOSED
}

export type Callback<T> = (success: boolean, result: T, msg: string) => void

export interface Result<T> {
    success: boolean
    result: T
    msg: string
}

const ackTimeout = 3000
const heartbeatInterval = 30000
const connectionTimeout = 3000
const requestTimeout = 3000

export interface MessageListener {
    (m:Message): void
}

type MessageCallBack = (m: CommonMessage<any>) => void

class WebSocketClient {

    private websocket?: WebSocket | null;

    private stateChangeListener: StateListener[];

    private seq: number;

    private heartbeat: any | null;

    private chatMessageListener: MessageListener[] = [];
    private groupMessageListner: ((m: Message) => void)[] = [];

    private ackCallBacks = new Map<number, MessageCallBack>();
    private apiCallbacks = new Map<number, MessageCallBack>();

    constructor() {
        this.websocket = null;
        this.seq = 1;

        this.stateChangeListener = [];
    }

    private static slog(where: string, ...msg: any[]) {
        console.log(`[WebSocket] ${where}:`, ...msg)
    }

    public connect(ws: string): Observable<string> {
        return new Observable((observer: Observer<string>) => {
            this.connectInternal(ws, (success, msg) => {
                if (success) {
                    observer.next("ws connected")
                } else {
                    observer.error(msg)
                }
                observer.complete()
            });
        });
    }

    private connectInternal(ws: string, callback: (success: boolean, msg: string) => void) {
        if (this.websocket != null) {
            if (this.websocket.readyState === WebSocket.OPEN) {
                this.websocket.close()
            }
        }

        let cb = callback;
        this.stateChangeListener.forEach((value => value(State.CONNECTING, "")));
        this.websocket = new WebSocket(ws);
        setTimeout(() => {
            if (!this.websocket?.OPEN) {
                if (cb != null) {
                    cb(false, "timeout");
                    cb = null;
                }
                this.websocket.close();
            }
        }, connectionTimeout);

        this.websocket.onerror = (e) => {
            WebSocketClient.slog("onerror", "" + e)
            if (cb != null) {
                cb(false, `ws connect failed ${e.type}`)
                cb = null
            }
        };
        this.websocket.onclose = (e) => {
            WebSocketClient.slog("onclose", "" + e)
            this.stateChangeListener.forEach((value => value(State.CLOSED, "error")))
        };
        this.websocket.onopen = (e) => {
            WebSocketClient.slog("onopen", "" + e)
            this.stateChangeListener.forEach((value => value(State.CONNECTED, "connected")))

            if (cb != null) {
                cb(true, `ok`)
                cb = null
            }
        };
        this.websocket.onmessage = ev => {
            this.onReceive(ev)
        };
        this.startHeartbeat()
    }

    /**
     * Request the api by websocket, auth, logout the connection etc.
     * @param action the action to request
     * @param data  the data to send
     */
    public request<T>(action: string, data?: any): Observable<T> {

        const d: string = data === null ? {} : data;
        const seq = this.seq++;

        const message: CommonMessage<any> = {
            Action: action,
            Data: d,
            Seq: seq,
        }

        return this.send(message)
            .pipe(
                mergeMap(() => this.getApiRespObservable<T>(seq)),
            )
    }

    public close() {
        if (this.websocket === null || this.websocket.readyState === WebSocket.CLOSED) {
            return
        }
        this.websocket?.close(3001, "bye")
    }

    public addChatMessageListener(l: (m: Message) => void) {
        this.chatMessageListener.push(l)
    }

    public removeChatMessageListener(l: (m: Message) => void) {
        const index = this.chatMessageListener.indexOf(l);
        if (index > -1) {
            this.chatMessageListener.splice(index, 1);
        }
    }

    public addStateListener(l: StateListener) {
        this.stateChangeListener.push(l)
    }

    public sendChatMessage(m: Message): Observable<Message> {

        return this.createCommonMessage(m)
            .pipe(
                mergeMap(msg => this.send(msg)),
                mergeMap((msg) => this.getAckObservable(msg.Data)),
                map(msg => msg)
            )
    }

    private createCommonMessage<T>(data: T): Observable<CommonMessage<T>> {
        return new Observable((observer: Observer<CommonMessage<T>>) => {
            const msg: CommonMessage<T> = {
                Action: Actions.MessageChat,
                Data: data,
                Seq: this.seq++,
            };
            observer.next(msg)
            observer.complete()
        })
    }

    private send<T>(data: CommonMessage<T>): Observable<CommonMessage<T>> {
        return new Observable((observer: Observer<CommonMessage<T>>) => {
            if (this.websocket === undefined) {
                observer.error("not initialized")
                return
            }
            if (this.websocket.readyState !== WebSocket.OPEN) {
                observer.error("not connected")
                return
            }
            const json = JSON.stringify(data);
            this.websocket.send(json)
            observer.next(data)
            observer.complete()
        });
    }

    private startHeartbeat() {
        clearInterval(this.heartbeat);

        this.heartbeat = setInterval(() => {
            if (this.websocket === undefined || this.websocket.readyState !== WebSocket.OPEN) {
                return
            }
            const hb: CommonMessage<{}> = {
                Action: Actions.Heartbeat,
                Data: {},
                Seq: this.seq++,
            }
            this.send(hb)
                .subscribe({
                    next: (m: CommonMessage<any>) => {
                        WebSocketClient.slog("heartbeat", "ok", m)
                    },
                    error: (e) => {
                        WebSocketClient.slog("heartbeat", "failed", e)
                    },
                    complete: () => {
                    }
                })
        }, heartbeatInterval)
    }

    private getAckObservable(msg: Message): Observable<Message> {
        return new Observable<Message>((observer: Observer<Message>) => {
            this.ackCallBacks.set(msg.Mid, () => {
                observer.next(msg)
                observer.complete()
            });
        }).pipe(
            timeoutOpt(requestTimeout)
        );
    }

    private getApiRespObservable<T>(seq: number): Observable<T> {
        return new Observable((observer: Observer<T>) => {
            this.apiCallbacks.set(seq, (m: CommonMessage<any>) => {
                if (m.Action === Actions.ApiSuccess) {
                    const obj = m.Data;
                    observer.next(obj as T)
                } else {
                    observer.error(m.Data)
                }
                observer.complete()
            })
        })
            .pipe(
                timeoutOpt(ackTimeout)
            )
    }

    private onIMMessage(msg: CommonMessage<any>) {
        switch (msg.Action) {
            case Actions.MessageChat:
                this.chatMessageListener.forEach(l => l(msg.Data));
                break;
            case Actions.MessageGroup:
                this.chatMessageListener.forEach(l => l(msg.Data));
                break;
            case Actions.MessageChatRecall:
                this.chatMessageListener.forEach(l => l(msg.Data));
                break;
            case Actions.MessageGroupRecall:
                this.chatMessageListener.forEach(l => l(msg.Data));
                break;
            default:
                WebSocketClient.slog("onIMMessage", "unknown message", msg)
        }
    }

    private onAckMessage(msg: CommonMessage<any>) {
        switch (msg.Action) {
            case Actions.AckMessage:
                console.log("ack", msg);
                break;
            case Actions.AckNotify:
                console.log("ack notify", msg);
                break;
            default:
                WebSocketClient.slog("onAckMessage", "unknown", msg);
                return;
        }
        const ack = msg.Data as AckMessage;
        const callback = this.ackCallBacks.get(ack.mid)

        if (callback === undefined) {
            WebSocketClient.slog("onAckMessage", "no callback", msg);
        } else {
            callback(msg)
        }
    }

    private onNotifyMessage(msg: CommonMessage<any>) {

    }

    private onReceive(data: MessageEvent) {
        const msg: CommonMessage<any> = JSON.parse(data.data) as CommonMessage<any>;

        if (msg.Action.startsWith("api")) {
            const callback = this.apiCallbacks.get(msg.Seq);
            if (callback) {
                callback(msg)
            } else {
                WebSocketClient.slog("onReceive", "no callback for api, data", msg)
            }
            return
        }
        if (msg.Action.startsWith("message")) {
            this.onIMMessage(msg)
            return
        }
        if (msg.Action.startsWith("ack")) {
            this.onAckMessage(msg)
            return
        }
        if (msg.Action.startsWith("notify")) {
            this.onNotifyMessage(msg)
            return
        }
    }
}

export const Ws = new WebSocketClient();
