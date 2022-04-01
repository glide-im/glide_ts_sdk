import { map, mergeMap, Observable, Observer } from "rxjs";
import { Actions, CommonMessage, Message } from "./message";

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

const heartbeatInterval = 10000
const connectionTimeout = 3000
const requestTimeout = 3000

type MessageCallBack = (m: CommonMessage<any>) => void

class WebSocketClient {

    private websocket?: WebSocket | null;

    private stateChangeListener: StateListener[];

    private messageCallbacks: Map<number, Callback<any>>;
    private seq: number;

    private heartbeat: any | null;
    private waits: Map<number, () => void> = new Map<number, () => void>();

    private ackCallBacks = new Map<number, MessageCallBack>();
    private apiCallbacks = new Map<number, MessageCallBack>();

    constructor() {
        this.websocket = null;
        this.seq = 1;
        this.stateChangeListener = [];
        this.messageCallbacks = new Map<number, any>()
    }

    private static slog(where: string, ...msg: any[]) {
        console.log(`[WebSocket] ${where}: ${msg.map(r => r.toString()).join(' ')}`)
    }

    public connect(ws: string, callback: (success: boolean, msg: string) => void) {
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
    public request<T>(action: string, data?: any): Promise<T> {

        const d: string = data === null ? {} : data;
        const seq = this.seq++;

        const message: CommonMessage<any> = {
            Action: action,
            Data: d,
            Seq: seq,
        }

        return new Promise<T>((resolve, reject) => {
            // flag to indicate if the request is completed
            let complete = false;

            const timeout = setTimeout(() => {
                if (!complete) {
                    complete = true;
                    reject(new Error("timeout"))
                }
            }, requestTimeout);

            this.send(message)
                .then(() => {
                    if (complete) {
                        return;
                    }
                    this.apiCallbacks.set(seq, (m: CommonMessage<any>) => {
                        complete = true;
                        if (m.Action === Actions.ApiSuccess) {
                            const obj = m.Data;
                            resolve(obj as T)
                        } else {
                            reject(m.Data)
                        }
                    })
                })
                .catch(e => {
                    if (complete) {
                        return;
                    }
                    complete = true;
                    reject(e)
                })
                .finally(() => {
                    clearTimeout(timeout);
                })
        })
    }

    public close() {
        if (this.websocket === null || this.websocket.readyState === WebSocket.CLOSED) {
            return
        }
        this.websocket?.close(3001, "bye")
    }

    public addStateListener(l: StateListener) {
        this.stateChangeListener.push(l)
    }

    public sendChatMessage(m: Message): Observable<Message> {
        return new Observable((observer: Observer<CommonMessage<Message>>) => {
            const data: CommonMessage<Message> = {
                Action: Actions.MessageChat,
                Data: m,
                Seq: this.seq++,
            };
            observer.next(data)
            observer.complete()
        })
            .pipe(
                mergeMap(r => this.sendRx(r)),
                map(r => r.Data)
            )
    }

    private createMessageObservable<T>(data: T): Observable<T> {
        return new Observable((observer: Observer<CommonMessage<T>>) => {
            const msg: CommonMessage<T> = {
                Action: Actions.MessageChat,
                Data: data,
                Seq: this.seq++,
            };
            observer.next(msg)
            observer.complete()
        })
            .pipe<CommonMessage<T>>(
                mergeMap(m => this.sendRx(m)),
            )
            .pipe(
                map(m => m.Data)
            )
    }

    private getSeq(): Observable<number> {
        return new Observable((observer: Observer<number>) => {
            observer.next(this.seq++)
            observer.complete()
        });
    }

    private sendRx<T>(data: CommonMessage<T>): Observable<CommonMessage<T>> {
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

    private send(data: CommonMessage<any>): Promise<any> {
        return new Promise((resolve, reject) => {
            if (this.websocket === undefined || this.websocket.readyState !== WebSocket.OPEN) {
                reject("not connected")
                return
            }
            const json = JSON.stringify(data);
            this.websocket.send(json)
            resolve("ok")
        })
    }

    private startHeartbeat() {
        clearInterval(this.heartbeat);
        this.heartbeat = setInterval(() => {
            const hb: CommonMessage<any> = {
                Action: Actions.Heartbeat,
                Data: {},
                Seq: this.seq++,
            }
            this.send(hb)
                .then(() => {

                })
                .catch(e => {
                    WebSocketClient.slog("heartbeat", "failed")
                })
        }, heartbeatInterval)
    }

    private wait(seq: number, cb: () => void) {
        this.waits.set(seq, cb)
    }

    private onIMMessage(msg: CommonMessage<any>) {

    }

    private onAckMessage(msg: CommonMessage<any>) {

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
