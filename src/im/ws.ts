import {Actions, CommonMessage} from "./message";

export type Listener = (msg: CommonMessage) => void

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

type MessageCallBack = (m: CommonMessage) => void

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

    private static slog(where: string, msg: string) {
        console.log(`[WebSocket] ${where}: ${msg}`)
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

        clearInterval(this.heartbeat);
        this.heartbeat = setInterval(() => {
            if (this.websocket.readyState === WebSocket.OPEN) {
                this.sendMessage(Actions.Heartbeat, {})
            }
        }, heartbeatInterval)
    }

    /**
     * Request the api by websocket, auth, logout the connection etc.
     * @param action the action to request
     * @param data  the data to send
     */
    public request<T>(action: string, data?: any): Promise<T> {

        const d: string = data === null ? {} : data;
        const seq = this.seq++;

        const message: CommonMessage = {
            Action: action,
            Data: d,
            Seq: seq,
        }

        return new Promise<T>((resolve, reject) => {
            // flag to indicate if the request is completed
            let complete = false;

            const timeout

            this.send(message)
                .then(() => {
                    if (complete) {
                        return;
                    }
                    this.apiCallbacks.set(seq, (m: CommonMessage) => {
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

    public sendMessage<T>(action: string, data: any, cb?: Callback<T>) {
        if (this.websocket?.OPEN !== 1) {
            return
        }
        let dat = "";
        try {
            dat = JSON.stringify(data)
        } catch (e) {
            if (cb) {
                cb(false, null, "cannot json to string of " + data)
            }
            return;
        }
        let m: CommonMessage = {
            Action: action,
            Data: dat,
            Seq: this.seq++
        };
        if (cb) {
            this.messageCallbacks.set(m.Seq, cb)
        }
        this.websocket.send(JSON.stringify(m))
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

    public sendMessage2() {

    }

    private wait(seq: number, cb: () => void) {
        this.waits.set(seq, cb)
    }

    private send(data: any): Promise<any> {
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

    private onIMMessage(msg: CommonMessage) {

    }

    private onAckMessage(msg: CommonMessage) {

    }

    private onNotifyMessage(msg: CommonMessage) {

    }

    private onReceive(data: MessageEvent) {
        const msg: CommonMessage = JSON.parse(data.data) as CommonMessage;

        if (msg.Action.startsWith("api")) {
            const callback = this.apiCallbacks.get(msg.Seq);
            if (callback) {
                callback(msg)
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
