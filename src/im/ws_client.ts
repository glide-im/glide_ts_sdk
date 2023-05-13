import {concat, filter, interval, map, Observable, Subject, take, throwError, timeout} from "rxjs";
import {Logger} from "../utils/Logger";

export interface ConnectConfig {
    url: string
    timeout?: number
}

export interface WebSockEvent {
    state: number,
    event: any
}

const DEFAULT_TIMEOUT = 5000;

export class WsClient {

    private tag = "WsClient";

    private websocket: WebSocket | null;
    private readyState: number

    private eventSubject = new Subject<WebSockEvent>();
    private messageSubject = new Subject<MessageEvent>();

    constructor() {
        this.readyState = WebSocket.CLOSED;
        this.websocket = null;
    }

    public connect(url: string | ConnectConfig): Observable<string> {
        if (typeof url == "string") {
            return this.connectWithComplete(url).pipe(

            )
        } else {
            return this.connectWithComplete(url.url).pipe(
                timeout(url.timeout || DEFAULT_TIMEOUT)
            )
        }
    }

    private connectWithComplete(url: string): Observable<string> {
        return concat(
            this.connectInternal(url),
            interval(100).pipe(
                filter(() => this.readyState !== WebSocket.CONNECTING),
                take(1),
                map(() => "ws connect success")
            )
        )
    }

    private connectInternal(url: string): Observable<string> {
        if (this.websocket && (this.websocket.readyState === WebSocket.OPEN || this.readyState === WebSocket.OPEN)) {
            throwError(() => "websocket is already open");
        }

        return new Observable((subscriber) => {
            this.readyState = WebSocket.CONNECTING
            subscriber.next("ws connecting")

            this.websocket = new WebSocket(url);

            this.websocket.onclose = (ev: CloseEvent) => {
                this.closeInternal(ev);
            }
            this.websocket.onerror = (ev: Event) => {
                this.closeInternal(ev);
            }
            this.websocket.onmessage = (ev: MessageEvent) => {
                this.messageSubject.next(ev);
            }
            this.websocket.onopen = (ev: Event) => {
                this.readyState = WebSocket.OPEN;
                this.eventSubject.next({state: WebSocket.OPEN, event: ev});
            }

            subscriber.complete()
        })
    }

    private closeInternal(event: any) {
        try {
            if (this.websocket) {
                this.websocket.close();
                this.websocket = null;
                this.readyState = WebSocket.CLOSED;
                this.eventSubject.next({state: WebSocket.CLOSED, event: event});
            }
        } catch (e) {
            Logger.error(this.tag, "close websocket error", e)
        }
    }

    public send(data: string | ArrayBufferLike | Blob | ArrayBufferView): Observable<string | ArrayBufferLike | Blob | ArrayBufferView> {
        return new Observable((subscriber) => {
            if (this.websocket && this.websocket.readyState === WebSocket.OPEN && this.readyState === WebSocket.OPEN) {
                try {
                    this.websocket.send(data);
                    subscriber.next(data)
                } catch (e) {
                    subscriber.error(e)
                }
            } else {
                subscriber.error("websocket is not ready")
            }
            subscriber.complete()
        })
    }

    public messageEvent(): Subject<MessageEvent> {
        return this.messageSubject;
    }

    public close() {
        this.closeInternal("close by user");
    }

    public isReady(): boolean {
        return this.websocket && this.websocket.readyState === WebSocket.OPEN && this.readyState === WebSocket.OPEN;
    }

    public event(): Subject<WebSockEvent> {
        return this.eventSubject;
    }


}