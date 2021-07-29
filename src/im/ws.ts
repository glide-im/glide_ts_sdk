import {Message, RespActionFailed} from "./message";

export type Listener = (msg: Message) => void

export type StateListener = (state: State, msg: string) => void

export enum State {
    CONNECTED,
    CONNECTING,
    CLOSED
}

export type Callback<T> = (success: boolean, result: T, msg: string) => void

class MyWs {

    private websocket?: WebSocket | null
    private listener: Listener[]
    private stateChangeListener: StateListener[]

    private request: Map<number, Callback<any>>
    private seq: number

    constructor() {
        this.websocket = null
        this.seq = 1
        this.listener = []
        this.stateChangeListener = []
        this.request = new Map<number, any>()
    }

    public connect() {

        this.stateChangeListener.forEach((value => value(State.CONNECTING, "")))
        this.websocket = new WebSocket("ws://127.0.0.1:8080/ws")
        setTimeout(() => {
            if (!this.websocket?.OPEN) {
                // this.listener.forEach((value => value("TIMEOUT")))
            }
        }, 1000 * 3);

        this.websocket.onerror = (e) => {
            // this.listener.forEach((value => value("ERROR: " + e)))
        }
        this.websocket.onclose = (e) => {
            // this.listener.forEach((value => value("CLOSED")))
            this.stateChangeListener.forEach((value => value(State.CLOSED, "error")))
        }
        this.websocket.onopen = (e) => {
            // this.listener.forEach((value => value("CONNECTED")))
            this.stateChangeListener.forEach((value => value(State.CONNECTED, "connected")))
        }
        this.websocket.onmessage = ev => {
            this.onMessage(ev)
        }
    }

    public sendMessage<T>(action: number, data: any, cb: Callback<T> | null) {
        if (this.websocket?.OPEN !== 1) {
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

    public addMessageListener(fn: Listener) {
        this.listener.push(fn)
    }

    private onMessage(data: MessageEvent) {
        let msg: Message = JSON.parse(data.data)
        let log: any
        try {
            log = JSON.parse(msg.Data)
        } catch (e) {
            log = msg.Data
        }
        console.log("New Message => ", msg.Action, msg.Seq, log)
        this.listener.forEach((value => value(msg)))

        if (this.request.has(msg.Seq)) {
            let cb = this.request.get(msg.Seq)

            if (msg.Action === RespActionFailed || msg.Action === 0) {
                // @ts-ignore
                cb.call(this, false, null, data.data)
            } else {
                if (msg.Data.length === 0) {
                    // @ts-ignore
                    cb.call(this, true, msg.Data, "body empty")
                }else{
                    // @ts-ignore
                    cb.call(this, true, JSON.parse(msg.Data), "ok")
                }
            }
            this.request.delete(msg.Seq)
        }
    }
}

export const Ws = new MyWs()
