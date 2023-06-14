import {
    catchError,
    concat,
    delay,
    filter,
    interval,
    map,
    mergeMap,
    Observable,
    of,
    race,
    Subject,
    Subscription,
    take,
    tap,
    throwError,
    timeout,
    TimeoutError,
} from 'rxjs';
import {
    AckMessage,
    AckNotify,
    AckRequest,
    Actions,
    CliCustomMessage,
    CommonMessage,
    Message,
} from './message';
import { Logger } from '../utils/Logger';
import { WebSockEvent, WsClient } from './ws_client';

const ackTimeout = 3000;
const heartbeatInterval = 30000;
const connectionTimeout = 3000;
const requestTimeout = 3000;

// 测试用, 模拟接收端网络延迟
const ackRequestDelayForDebug = 1600;
// 测试用, 模拟发送端网络延迟
const ackMessageDelayForDebug = 800;

export interface MessageSendResult {
    mid: number;
    cliId: string;
    seq: number;
    action: Actions.AckMessage | Actions.AckNotify | null;
}

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
                // TODO 群消息ack策略更新, 聊天中, 积累一定数量的消息后, 或群聊冷却后ack
                Logger.log(this.tag1, "receive message >>", [m])
                if (m.action === Actions.MessageChat || m.action === Actions.MessageChatRecall) {
                    const msg: Message = m.data as Message;
                    this.ackRequestMessage(msg.from, msg.mid)
                }
            }
        })
    }

    public connect(ws: string): Observable<string> {
        return super.connect({url: ws, timeout: connectionTimeout, ignoreError: true})
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
            map((m: CommonMessage<any>) => {
                if (m.action === Actions.NotifyError || m.action === Actions.ApiFailed) {
                    throw new Error(m.data);
                }
                return m;
            }),
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

    public sendChannelMessage(m: Message): Observable<MessageSendResult> {
        const msg = this.createCommonMessage(m.to, Actions.MessageGroup, m)
        msg.ticket = ""
        // TODO 添加会话 ticket
        return concat(
            of(msg).pipe(
                mergeMap(msg => this.sendProtocolMessage(msg)),
                map(() => ({mid: 0, cliId: m.cliMid, seq: m.seq} as MessageSendResult))
            ),
            race(
                this.getAckObservable(m),
                this.getSendFailedObservable(msg)
            )
        )
    }

    public sendChatMessage(m: Message): Observable<MessageSendResult> {
        const msg = this.createCommonMessage(m.to, Actions.MessageChat, m)
        // TODO 添加会话 ticket
        return concat(
            // 发送消息
            of(msg).pipe(
                mergeMap(msg => this.sendProtocolMessage(msg)),
                map(() => ({mid: 0, cliId: m.cliMid, seq: m.seq} as MessageSendResult))
            ),
            // 等待服务器 ack
            race(
                this.getAckObservable(m),
                this.getSendFailedObservable(msg)
            ),
            // 等待接收者 ack
            this.getAckNotifyObservable(m)
        ).pipe(
            filter(r => r.action !== null),
        )
    }

    public sendCliCustomMessage(m: CliCustomMessage): Observable<CliCustomMessage> {
        return of(this.createCommonMessage(m.to, Actions.MessageCli, m)).pipe(
            mergeMap(msg => this.sendProtocolMessage(msg)),
            map(() => m)
        );
    }

    public sendRecallMessage(m: Message) {
        return of(this.createCommonMessage(m.to, Actions.MessageChatRecall, m)).pipe(
            mergeMap(msg => this.sendProtocolMessage(msg)),
            mergeMap(msg => this.getAckObservable(msg.data))
        );
    }

    private createCommonMessage<T>(to: string | null, action: Actions, data: T): CommonMessage<T> {
        return {
            action: action,
            data: data,
            seq: this.seq++,
            to: to,
            extra: null,
        }
    }

    private sendProtocolMessage<T>(data: CommonMessage<T>): Observable<CommonMessage<T>> {
        const msg = JSON.stringify(data)
        return super.send(msg).pipe(
            map(() => data),
            tap(() => Logger.log(this.tag1, "send message >>", [data])),
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

    private getAckObservableFail(msg: Message): Observable<MessageSendResult> {
        return of(1).pipe(
            delay(ackTimeout),
            map(() => {
            }),
            mergeMap(() => throwError(new Error("ack timeout")))
        )
    }

    private getSendFailedObservable(msg: CommonMessage<any>): Observable<MessageSendResult> {
        return this.messages().pipe(
            filter(m => msg.seq === m.seq),
            filter(m => m.action === Actions.NotifyError || m.action === Actions.NotifyForbidden),
            take(1),
            map(m => {
                throw new Error(m.data)
            })
        )
    }

    // 服务器回执消息, 用于确认消息发送成功, 服务器会返回该消息的 mid
    private getAckObservable(msg: Message): Observable<MessageSendResult> {
        return this.messages().pipe(
            filter(m => m.action === Actions.AckMessage),
            map(m => m.data as AckMessage),
            filter(ack => ack.cliMid === msg.cliMid),
            take(1),
            map(ack => {
                // 服务器回执包含该消息 id
                msg.mid = ack.mid
                return ({
                    mid: ack.mid, cliId: ack.cliMid, seq: msg.seq, action: Actions.AckMessage
                } as MessageSendResult)
            }),
            timeout(ackTimeout),
            delay(ackMessageDelayForDebug),
            catchError((e) => {
                e = e instanceof TimeoutError ? new Error("ack timeout") : e
                return throwError(e)
            })
        )
    }

    // 接收者回执消息, 用于确认消息发送成功
    private getAckNotifyObservable(msg: Message): Observable<MessageSendResult> {
        return this.messages().pipe(
            filter(m => m.action === Actions.AckNotify),
            map(m => m.data as AckNotify),
            filter(ack => ack.mid === msg.mid),
            take(1),
            timeout(ackTimeout),
            map((res) => ({
                mid: res.mid, cliId: "", seq: 0, action: Actions.AckNotify
            } as MessageSendResult)),
            catchError((e) => of({action: null} as MessageSendResult)),
        )
    }

    private getApiRespObservable<T>(seq: number): Observable<CommonMessage<T>> {
        return this.messages().pipe(
            filter(m => m.seq === seq),
            filter(m => m.action === Actions.ApiSuccess || m.action === Actions.ApiFailed
                || m.action === Actions.NotifySuccess || m.action === Actions.NotifyError),
            take(1),
        )
    }

    // 发送 `收到消息` 回执, 表示接收者已经收到消息
    private ackRequestMessage(from: string, mid: number) {
        const ackR: AckRequest = {
            mid: mid,
            from: from,
        };

        of(this.createCommonMessage(from, Actions.AckRequest, ackR))
            .pipe(
                delay(ackRequestDelayForDebug),
                mergeMap(msg => this.sendProtocolMessage(msg))
            )
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
