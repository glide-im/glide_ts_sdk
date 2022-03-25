import {ActionFailed, ActionHeartbeat, Message} from "./message";
import {client} from "./client";


export type Listener = (msg: Message) => void

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

class MyWs {

    private websocket?: WebSocket | null;
    private listener: Listener | null;
    private stateChangeListener: StateListener[];

    private messageCallbacks: Map<number, Callback<any>>;
    private seq: number;

    private heartbeat: any | null;
    private waits: Map<number, () => void> = new Map<number, () => void>();

    constructor() {
        this.websocket = null;
        this.seq = 1;
        this.listener = null;
        this.stateChangeListener = [];
        this.messageCallbacks = new Map<number, any>()
    }

    public connect() {

        this.stateChangeListener.forEach((value => value(State.CONNECTING, "")));
        this.websocket = new WebSocket("ws://127.0.0.1:8080/ws");
        setTimeout(() => {
            if (!this.websocket?.OPEN) {
                // this.listener.forEach((value => value("TIMEOUT")))
                console.log("connect timeout")
            }
        }, 1000 * 3);

        this.websocket.onerror = (e) => {
            console.log("WS ERROR >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>", e)
            // this.listener.forEach((value => value("ERROR: " + e)))
        };
        this.websocket.onclose = (e) => {
            console.log("WS CLOSE >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>", e);
            // this.listener.forEach((value => value("CLOSED")))
            this.stateChangeListener.forEach((value => value(State.CLOSED, "error")))
        };
        this.websocket.onopen = (e) => {
            console.log("WS OPEN >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
            // this.listener.forEach((value => value("CONNECTED")))
            this.stateChangeListener.forEach((value => value(State.CONNECTED, "connected")))
        };
        this.websocket.onmessage = ev => {
            this.onMessage(ev)
        };

        clearInterval(this.heartbeat);
        this.heartbeat = setInterval(() => {
            this.sendMessage(ActionHeartbeat, {})
        }, 9000)
    }

    public request1<T>(action: string, data?: any): Promise<Result<T>> {
        const resolved = (resolve: (r: Result<T>) => void) => {
            this.sendMessage<T>(action, data, (success, result, msg) => {
                resolve({msg: msg, result: result, success: success})
            })
        };
        return new Promise<Result<T>>(resolved)
    }

    public request<T>(action: string, data?: any): Promise<T> {
        const executor = (resolve: (r: T) => void, reject: (reason: string) => void) => {
            this.sendMessage<T>(action, data, (success, result, msg) => {
                if (success) {
                    resolve(result)
                } else {
                    reject(msg)
                }
            })
        };
        return new Promise<T>(executor).catch(reason => client.catchPromiseReject(reason).then())
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
        let m: Message = {
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
        if (this.websocket === null) {
            return
        }
        this.websocket?.close(3001, "bye")
    }

    public addStateListener(l: StateListener) {
        this.stateChangeListener.push(l)
    }

    public setMessageListener(fn: Listener | null) {
        this.listener = fn
    }

    private onMessage(data: MessageEvent) {
        let msg: Message = JSON.parse(data.data);
        this.listener?.call(this, msg);

        if (this.messageCallbacks.has(msg.Seq)) {
            let cb = this.messageCallbacks.get(msg.Seq);

            if (msg.Action === ActionFailed) {
                // @ts-ignore
                cb(false, null, data.data)
            } else {
                if (msg.Data.length === 0) {
                    // @ts-ignore
                    cb(true, msg.Data, "body empty")
                } else {
                    // @ts-ignore
                    cb(true, JSON.parse(msg.Data), "ok")
                }
            }
            this.messageCallbacks.delete(msg.Seq)
        }
    }
}

export const Ws = new MyWs();
