import {Message, RespActionFailed} from "./message";

export type Listener = (msg: Message) => void

export type StateListener = (state: State, msg: string) => void

export enum State {
    CONNECTED,
    CONNECTING,
    CLOSED
}

export type Callback<T> = (success: boolean, result: T, msg: string) => void

class WS {

    private ws?: WebSocket | null
    private listener: Listener[]
    private stateChangeListener: StateListener[]

    private request: Map<number, Callback<any>>
    private seq: number

    constructor() {
        this.ws = null
        this.seq = 1
        this.listener = []
        this.stateChangeListener = []
        this.request = new Map<number, any>()
    }

    public connect() {

        this.stateChangeListener.forEach((value => value(State.CONNECTING, "")))
        this.ws = new WebSocket("ws://127.0.0.1:8080/ws")
        setTimeout(() => {
            if (!this.ws?.OPEN) {
                // this.listener.forEach((value => value("TIMEOUT")))
            }
        }, 1000 * 3);

        this.ws.onerror = (e) => {
            // this.listener.forEach((value => value("ERROR: " + e)))
        }
        this.ws.onclose = (e) => {
            // this.listener.forEach((value => value("CLOSED")))
            this.stateChangeListener.forEach((value => value(State.CLOSED, "error")))
        }
        this.ws.onopen = (e) => {
            // this.listener.forEach((value => value("CONNECTED")))
            this.stateChangeListener.forEach((value => value(State.CONNECTED, "connected")))
        }
        this.ws.onmessage = ev => {
            this.onMessage(ev)
        }
    }

    public sendMessage<T>(action: number, data: any, cb: Callback<T> | null) {
        if (!this.ws?.OPEN) {
            return
        }
        let m: Message = {
            Action: action,
            Data: JSON.stringify(data),
            Seq: Date.now() + (this.seq++)
        }
        if (cb !== null) {
            this.request.set(m.Seq, cb)
        }
        this.ws.send(JSON.stringify(m))
    }

    public close() {
        this.ws?.close(3001, "bye")
    }

    public addStateListener(l: StateListener) {
        this.stateChangeListener.push(l)
    }

    public addMessageListener(fn: Listener) {
        this.listener.push(fn)
    }

    private onMessage(data: MessageEvent) {
        let msg: Message = JSON.parse(data.data)
        this.listener.forEach((value => value(msg)))

        if (this.request.has(msg.Seq)) {
            let cb = this.request.get(msg.Seq)

            if (msg.Action === RespActionFailed || msg.Action === 0) {
                // @ts-ignore
                cb.call(this, false, null, data.data)
            } else {
                // @ts-ignore
                cb.call(this, true, JSON.parse(msg.Data), "")
            }
            this.request.delete(msg.Seq)
        }
    }
}

export const ws = new WS()
