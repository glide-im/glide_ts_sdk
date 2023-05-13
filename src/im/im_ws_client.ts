import {filter, interval, map, mergeMap, Observable, Observer, Subject, Subscription, take, timeout} from 'rxjs';
import {AckMessage, AckRequest, Actions, CliCustomMessage, CommonMessage, Message} from './message';
import {Logger} from "../utils/Logger";
import {WebSockEvent, WsClient} from "./ws_client";
import {onNext} from "../rx/next";

const ackTimeout = 3000;
const heartbeatInterval = 30000;
const connectionTimeout = 3000;
const requestTimeout = 3000;

class IMWebSocketClient extends WsClient {

    private tag1 = 'WebSocketClient';
    private seq: number;
    private heartbeat: Subscription | null;

    constructor() {
        super();
        this.seq = 1;
        this.startHeartbeat()
        this.events().subscribe({
            next: (e) => {
                Logger.log(this.tag1, "websocket event changed >>", [e])
            }
        })
        this.messages().subscribe({
            next: (m) => {
                Logger.log(this.tag1, "receive message >>", [m])
                if (m.action === Actions.MessageChat || m.action === Actions.MessageChatRecall) {
                    const msg: Message = m.data as Message;
                    this.ackRequestMessage(msg.from, msg.mid)
                }
            }
        })
    }

    public connect(ws: string): Observable<string> {
        return super.connect({url: ws, timeout: connectionTimeout})
    }

    /**
     * Request the api by websocket, auth, logout the connection etc.
     * @param action the action to request
     * @param data  the data to send
     */
    public request<T>(action: Actions, data?: any): Observable<CommonMessage<T>> {
        const d: string = data === null ? {} : data;
        const seq = this.seq++;

        const message: CommonMessage<any> = {
            action: action,
            data: d,
            seq: seq,
            to: null,
            extra: null,
        };

        return this.sendProtocolMessage(message).pipe(
            mergeMap(() => this.getApiRespObservable<T>(seq)),
            timeout(requestTimeout),
        );
    }

    public messages(): Observable<CommonMessage<any>> {
        return super.messageEvent().pipe(
            map((event: MessageEvent) => {
                    const msg: CommonMessage<any> = JSON.parse(event.data);
                    return msg;
                }
            )
        )
    }

    public events(): Subject<WebSockEvent> {
        return super.event()
    }

    public sendChannelMessage(m: Message): Observable<Message> {
        return this.createCommonMessage(m.to, Actions.MessageGroup, m).pipe(
            mergeMap(msg => this.sendProtocolMessage(msg)),
            mergeMap(msg => this.getAckObservable(msg.data))
        );
    }

    public sendChatMessage(m: Message): Observable<Message> {
        return this.createCommonMessage(m.to, Actions.MessageChat, m).pipe(
            mergeMap(msg => this.sendProtocolMessage(msg)),
            mergeMap(msg => this.getAckObservable(msg.data))
        );
    }

    public sendCliCustomMessage(m: CliCustomMessage): Observable<CliCustomMessage> {
        return this.createCommonMessage(m.to, Actions.MessageCli, m).pipe(
            mergeMap(msg => this.sendProtocolMessage(msg)),
            map(() => m)
        );
    }

    public sendRecallMessage(m: Message) {
        return this.createCommonMessage(m.to, Actions.MessageChatRecall, m).pipe(
            mergeMap(msg => this.sendProtocolMessage(msg)),
            mergeMap(msg => this.getAckObservable(msg.data))
        );
    }

    private createCommonMessage<T>(to: string | null, action: Actions, data: T): Observable<CommonMessage<T>> {
        return new Observable((observer: Observer<CommonMessage<T>>) => {
            const msg: CommonMessage<T> = {
                action: action,
                data: data,
                seq: this.seq++,
                to: to,
                extra: null,
            };
            observer.next(msg);
            observer.complete();
        });
    }

    private sendProtocolMessage<T>(data: CommonMessage<T>): Observable<CommonMessage<T>> {
        const msg = JSON.stringify(data)
        return super.send(msg).pipe(
            map(() => data),
            onNext(() => Logger.log(this.tag1, "send message >>", [data])),
        )
    }

    private startHeartbeat() {
        this.heartbeat = interval(heartbeatInterval)
            .pipe(
                filter(() => super.isReady()),
                map(() => {
                    const hb: CommonMessage<{}> = {
                        action: Actions.Heartbeat,
                        data: {},
                        seq: this.seq++,
                    };
                    return hb;
                }),
                mergeMap((hb) => this.sendProtocolMessage(hb)),
            )
            .subscribe({
                next: () => {
                    Logger.log(this.tag1, "heartbeat ok")
                },
                error: e => {
                    Logger.error(this.tag1, "heartbeat error", e)
                },
                complete: () => {
                    this.heartbeat = null
                    Logger.log(this.tag1, "heartbeat complete")
                }
            })
    }

    // 服务器回执消息, 用于确认消息发送成功, 服务器会返回该消息的 mid
    private getAckObservable(msg: Message): Observable<Message> {
        return this.messages().pipe(
            filter(m => m.action === Actions.AckMessage),
            map(m => m.data as AckMessage),
            filter(ack => ack.cliMid === msg.cliMid),
            take(1),
            timeout(ackTimeout),
            map(ack => {
                // 服务器回执包含该消息 id
                msg.mid = ack.mid
                return msg
            })
        )
    }

    private getApiRespObservable<T>(seq: number): Observable<CommonMessage<T>> {
        return this.messages().pipe(
            filter(m => m.seq === seq),
            filter(m => m.action === Actions.ApiSuccess || m.action === Actions.ApiFailed),
            take(1),
        )
    }

    private ackRequestMessage(from: string, mid: number) {
        const ackR: AckRequest = {
            mid: mid,
            from: from,
        };

        this.createCommonMessage(from, Actions.AckRequest, ackR)
            .pipe(mergeMap(msg => this.sendProtocolMessage(msg)))
            .subscribe({
                next: () => {
                },
                error: e => {
                    Logger.error(this.tag1, "ackRequestMessage", e);
                },
            });
    }

}

export const IMWsClient = new IMWebSocketClient();
