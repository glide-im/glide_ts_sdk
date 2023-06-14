import {
    catchError,
    concat,
    debounce,
    delay,
    filter,
    interval,
    map,
    mergeMap,
    Observable,
    of, retry, retryWhen,
    Subject,
    take,
    tap,
    throwError,
    timeout,
    toArray
} from "rxjs";
import { SessionBean } from "../api/model";
import { Account } from "./account";
import {
    ChatMessage,
    ChatMessageCache,
    ChatMessageInternal,
    createChatMessage,
    createChatMessage2,
    MessageUpdateType,
    SendingStatus
} from "./chat_message";
import { Cache } from "./cache";
import {
    Actions,
    CliCustomMessage,
    ClientCustomType,
    Message,
    MessageStatus,
    MessageType
} from "./message";
import { IMWsClient, isMessageSendError, MessageSendError, MessageSendResult, SendErrorCause } from "./im_ws_client";
import { Logger } from "../utils/Logger";
import { SessionListCache } from "./session_list";
import { Api } from "../api/api";

export type SessionId = string;

export enum SessionType {
    Single = 1,
    Channel = 2,
}

export enum SessionStatus {
    Default = 0,
    Muted = 1,
    Pinned = 2,
    Deleted = 3,
}

export function getSID(type: number, to: string): string {
    if (type === 2) {
        return to;
    }

    let lg = Account.getInstance().getUID();
    let sm = to;

    if (lg < sm) {
        let tmp = lg;
        lg = sm;
        sm = tmp;
    }
    return lg + "_" + sm;
}

export interface SessionBaseInfo {
    // sid
    readonly ID: SessionId;
    readonly Avatar: string;
    readonly Title: string;
    readonly UpdateAt: number;
    readonly LastMessageSender: string;
    readonly LastMessage: string;
    readonly UnreadCount: number;
    readonly Type: SessionType;
    readonly To: string;
    readonly Status: SessionStatus;
    readonly Ticket: string;
}

export enum SessionEventType {
    Initial = "initial",
    UpdateBaseInfo = "update_base_info",
    UpdateUnreadCount = "update_unread_count",
    UpdateLastMessage = "update_last_message",
    NewMessage = "new_message",
    MessageUpdate = "message_update",
    ReloadMessageHistory = "message_history",
    OnlineStatusUpdate = "online_status_update",
}

export interface SessionEvent {
    readonly type: SessionEventType;
    readonly session: Session;
    readonly message?: any;
}

export interface Session extends SessionBaseInfo {
    readonly messageSubject: Subject<ChatMessage>;
    readonly event: Subject<SessionEvent>;
    readonly inputEvent: Observable<Array<string>>;

    waitInit(): Observable<InternalSession>;

    clearUnread(): void;

    sendTextMessage(content: string): Observable<ChatMessage>;

    sendImageMessage(url: string): Observable<ChatMessage>;

    sendUserTypingEvent();

    send(content: string, type: number): Observable<ChatMessage>;

    getMessages(): ChatMessage[];

    getMessageHistory(beforeMid: number | null): Observable<ChatMessage[]>;

    clearMessageHistory(): Observable<any>;
}

export interface InternalSession extends Session {
    onMessage(action: Actions, message: Message | CliCustomMessage);

    update(session: SessionBean | SessionBaseInfo);

    init(): Observable<InternalSession>;

    setCache(cache: SessionListCache & ChatMessageCache);
}

export function createSession(
    to: string,
    type: SessionType,
    cache: SessionListCache & ChatMessageCache
): InternalSession {
    const ret = InternalSessionImpl.create(to, type);
    ret.setCache(cache);
    return ret;
}

export function fromSessionBean(
    sessionBean: SessionBean,
    cache: SessionListCache & ChatMessageCache
): InternalSession {
    const ret = InternalSessionImpl.fromSessionBean(sessionBean);
    ret.setCache(cache);
    return ret;
}

export function fromBaseInfo(
    baseInfo: SessionBaseInfo,
    cache: SessionListCache & ChatMessageCache
): InternalSession {
    const ret = InternalSessionImpl.fromBaseInfo(baseInfo);
    ret.setCache(cache);
    return ret;
}

class InternalSessionImpl implements InternalSession {
    private tag = "InternalSessionImpl";

    public ID: SessionId;
    public Avatar: string;
    public Title: string;
    public UpdateAt: number;
    public LastMessageSender: string;
    public LastMessage: string;
    public UnreadCount: number = 0;
    public Type: SessionType;
    public To: string;
    public Status: SessionStatus;
    public Ticket: string;

    private messageList = new Array<ChatMessageInternal>();
    private messageMap = new Map<string, ChatMessageInternal>();

    private readonly _messageSubject: Subject<ChatMessageInternal> =
        new Subject<ChatMessageInternal>();
    private readonly _updateSubject: Subject<SessionEvent> =
        new Subject<SessionEvent>();
    private readonly _inputEventReceive: Subject<Array<string>> = new Subject<
        Array<string>
    >();
    private readonly _typingEventEmitter: Subject<any> = new Subject<any>();

    private initialized = false;
    private cache: SessionListCache & ChatMessageCache;

    private constructor(type: SessionType, to: string) {
        this.LastMessage = "-";
        this.LastMessageSender = "-";
        this.UnreadCount = 0;

        this.To = to;
        this.Type = type;
        this.ID = this.getSID();
        this.Title = this.ID;
        this.UpdateAt = Date.now();

        this.event.subscribe({
            next: (event) => {
                Logger.log(
                    this.tag,
                    "event",
                    event.session.ID,
                    event.type,
                    event.message?.Sending,
                    event.message?.getDisplayContent()
                );
            }
        });

        // send typing event
        this._typingEventEmitter.pipe(debounce(() => interval(100))).subscribe({
            next: () => {
                const myUid = Account.getInstance().getUID();
                const m = {
                    content: JSON.stringify(
                        Account.getInstance().getUserInfo()
                    ),
                    from: myUid,
                    id: 0,
                    to: this.To,
                    type: ClientCustomType.CliMessageTypeTyping
                } as CliCustomMessage;
                IMWsClient.sendCliCustomMessage(m).subscribe({
                    error: (e) => {
                        Logger.error(this.tag, "send typing event error", e);
                    }
                });
            }
        });
    }

    get messageSubject(): Subject<ChatMessage> {
        return this._messageSubject;
    }

    get event(): Subject<SessionEvent> {
        return this._updateSubject;
    }

    private isSelected(): boolean {
        return this.ID === Account.session().getCurrentSession()?.ID;
    }

    public static create(to: string, type: SessionType): InternalSessionImpl {
        return new InternalSessionImpl(type, to);
    }

    public static fromSessionBean(sb: SessionBean): InternalSessionImpl {
        let session = new InternalSessionImpl(
            SessionType.Single,
            sb.To.toString()
        );
        session.UpdateAt = sb.UpdateAt;
        return session;
    }

    public static fromBaseInfo(baseInfo: SessionBaseInfo): InternalSessionImpl {
        let session = new InternalSessionImpl(baseInfo.Type, baseInfo.To);
        session.Title = baseInfo.Title;
        session.UpdateAt = baseInfo.UpdateAt;
        session.LastMessageSender = baseInfo.LastMessageSender;
        session.LastMessage = baseInfo.LastMessage;
        session.UnreadCount = baseInfo.UnreadCount;
        return session;
    }

    public setCache(cache: SessionListCache & ChatMessageCache) {
        this.cache = cache;
    }

    get inputEvent(): Observable<Array<string>> {
        return this._inputEventReceive.asObservable();
    }

    public waitInit(): Observable<InternalSession> {
        return interval(100).pipe(
            filter(() => this.initialized),
            take(1),
            map(() => this)
        );
    }

    public clearMessageHistory(): Observable<any> {
        return of(...this.messageList).pipe(
            mergeMap((message) => this.cache.deleteMessage(message.getId())),
            toArray(),
            tap(() => {
                this.messageList = [];
                this.messageMap.clear();
                this.LastMessage = "";
                this.LastMessageSender = "";
                this.UpdateAt = Date.now();
                this.sync2Cache("clear history");

                this.clearUnread();
                this.event.next({
                    type: SessionEventType.UpdateLastMessage,
                    session: this
                });
                this.event.next({
                    type: SessionEventType.ReloadMessageHistory,
                    session: this
                });
            })
        );
    }

    public clearUnread() {
        if (this.UnreadCount === 0) {
            return;
        }
        this.UnreadCount = 0;
        this.sync2Cache("UnreadCount");
        this.event.next({
            type: SessionEventType.UpdateUnreadCount,
            session: this
        });
    }

    public init(): Observable<InternalSession> {
        const initBaseInfo = this.isGroup()
            ? of(Cache.getChannelInfo(this.ID))
            : Cache.loadUserInfo1(this.To);

        if (this.To === "the_world_channel") {
            of("Hi, 我来了")
                .pipe(
                    delay(2000),
                    mergeMap((msg) => this.sendTextMessage(msg)),
                    toArray()
                )
                .subscribe({
                    next: (msg) => Logger.log(this.tag, "hello message sent"),
                    error: (err) =>
                        Logger.error(
                            this.tag,
                            "hello message send failed",
                            err
                        )
                });
        }

        return concat(
            initBaseInfo.pipe(
                map((info) => {
                    Logger.log(
                        this.tag,
                        "init session ",
                        info.id,
                        info.name,
                        info.avatar
                    );
                    this.Title = info.name ?? this.To;
                    this.Avatar = info.avatar ?? "-";
                    this.event.next({
                        type: SessionEventType.UpdateBaseInfo,
                        session: this
                    });
                    this.initialized = true;
                })
            ),
            this.cache.getSessionMessagesByTime(this.ID, Date.now()).pipe(
                mergeMap((msgs) => of(...msgs)),
                map((msg) => createChatMessage(msg)),
                toArray(),
                map((msgs) => {
                    const sorted = msgs.sort((a, b) => a.SendAt - b.SendAt);
                    for (let m in sorted) {
                        this.messageList.push(sorted[m]);
                        this.messageMap.set(sorted[m].getId(), sorted[m]);
                    }
                    Logger.log(
                        this.tag,
                        "init session ",
                        this.ID,
                        "message count",
                        msgs.length
                    );
                })
            )
        ).pipe(map((info) => this));
    }

    public isGroup(): boolean {
        return this.Type === SessionType.Channel;
    }

    public getMessageHistory(
        beforeMid: number | null
    ): Observable<ChatMessage[]> {
        if (beforeMid === null && this.messageList.length !== 0) {
            beforeMid = Number.MAX_SAFE_INTEGER;
        }

        const res = this.getMessageBeforeMid(beforeMid);
        // if (res.length !== 0) {
        return of(res);
        // }

        // switch (this.Type) {
        //     case SessionType.Single:
        //         return Api.getMessageHistry(this.To, beforeMid)
        //             .pipe(
        //                 mergeMap(resp => of(...resp)),
        //                 map(msg => ChatMessage.create2(msg, this.Type)),
        //                 onNext(msg => {
        //                     this.addMessageByOrder(msg)
        //                 }),
        //                 toArray(),
        //             )
        //     case SessionType.Group:
        //         return of();
        //     default:
        //         return throwError(() => new Error("unknown session type"));
        // }
    }

    public onMessage(action: Actions, message: Message | CliCustomMessage) {
        if (action === Actions.MessageCli) {
            const m = message as CliCustomMessage;
            switch (message.type) {
                case ClientCustomType.CliMessageTypeTyping:
                    this._inputEventReceive.next(JSON.parse(m.content));
                    break;
            }
            return;
        }

        if (message.type > MessageType.WebRtcHi) {
            return;
        }
        const isChannel =
            action === Actions.MessageGroup ||
            action === Actions.MessageGroupRecall ||
            action === Actions.NotifyGroup;
        const chatMessage = createChatMessage2(
            this.ID,
            message as Message,
            isChannel
        );

        switch (chatMessage.Type) {
            case MessageType.StreamMarkdown:
            case MessageType.StreamText:
                let streamMessage = this.messageMap.get(chatMessage.getId());
                if (streamMessage === undefined || streamMessage === null) {
                    this.onReceiveStreamMessage(chatMessage);
                    break;
                }
                // update stream message
                streamMessage.update(chatMessage);
                return;
        }
        // todo filter none-display message

        Logger.log(this.tag, "onMessage", this.ID, message.type, [
            chatMessage.getId(),
            chatMessage.getDisplayContent(false)
        ]);
        // TODO 优化

        this.cache.addMessage(chatMessage).subscribe({
            next: () => {
                this.addMessage(chatMessage);
            },
            error: (err) => {
                Logger.error(this.tag, [chatMessage], "add message error", err);
            }
        });
        // Cache.cacheUserInfo(message.from).then(() => {
        //     this.addMessageByOrder(c);
        // })
    }

    private onReceiveStreamMessage(chatMessage: ChatMessage) {
        chatMessage.events().subscribe({
            next: () => {
                this.event.next({
                    type: SessionEventType.MessageUpdate,
                    session: this,
                    message: chatMessage
                });
            }
        });

        // 首次收到消息, 订阅消息更新
        chatMessage
            .events()
            .pipe(
                timeout(10000),
                filter(
                    (event) => event.type === MessageUpdateType.UpdateStatus
                ),
                filter(
                    (event) =>
                        event.message.Status !== MessageStatus.StreamSending
                ),
                take(1),
                mergeMap((event) => this.cache.updateMessage(event.message))
            )
            .subscribe({
                next: () => {
                    const last = this.messageList[this.messageList.length - 1];
                    if (last?.getId() === chatMessage.getId()) {
                        this.LastMessage = chatMessage.getDisplayContent(false);
                    }
                    this.event.next({
                        type: SessionEventType.UpdateLastMessage,
                        session: this,
                        message: chatMessage
                    });
                    Logger.log(
                        this.tag,
                        [chatMessage],
                        "stream message complete, cache updated"
                    );
                },
                error: (err) => {
                    Logger.error(
                        this.tag,
                        [chatMessage],
                        "update stream message cache error",
                        err
                    );
                }
            });
    }

    public sendTextMessage(msg: string): Observable<ChatMessage> {
        return this.send(msg, MessageType.Text);
    }

    public sendImageMessage(img: string): Observable<ChatMessage> {
        return this.send(img, MessageType.Image);
    }

    public getMessages(): ChatMessage[] {
        return Array.from(this.messageMap.values());
    }

    public sendUserTypingEvent() {
        if (this.isGroup()) {
            // TODO send typing event to group
            return;
        }
        this._typingEventEmitter.next("typing");
    }

    private getMessageBeforeMid(mid: number): ChatMessage[] {
        if (this.messageList.length === 0) {
            return [];
        }

        let index = 0;
        if (mid !== 0) {
            index = this.messageList.findIndex((msg) => msg.Mid <= mid);
            if (index === -1) {
                return [];
            }
        }

        return this.messageList.slice(index, this.messageList.length - index);
    }

    private addMessage(message: ChatMessageInternal) {
        const isNewMessage = !this.messageMap.has(message.getId());

        if (!isNewMessage) {
            this.messageMap.get(message.getId())?.update(message);
            this.cache.updateMessage(message).subscribe({
                next: () => {
                    Logger.log(this.tag, "message updated", message.CliMid);
                },
                error: (err) => {
                    Logger.error(this.tag, "message update failed", err);
                }
            });

            this.event.next({
                type: SessionEventType.MessageUpdate,
                session: this,
                message: message
            });
        } else {
            let index = this.messageList.findIndex(
                (msg) => msg.OrderKey > message.OrderKey
            );
            this.messageMap.set(message.getId(), message);
            if (index === -1) {
                this.messageList.push(message);
            } else {
                this.messageList.splice(index, 0, message);
            }
        }

        // TODO 收到老消息
        // const isNotHistoryMessage = this.messageList[this.messageList.length - 1].getId() === message.getId()
        if (this.messageList.length > 0 && isNewMessage) {
            if (!message.FromMe && !this.isSelected()) {
                this.UnreadCount++;
            }
            this.LastMessage = message.getDisplayContent(false);
            this.LastMessageSender = message.getSenderName();

            this.UpdateAt = message.SendAt;
            this.messageSubject.next(message);
        }

        if (isNewMessage) {
            this.event.next({
                type: SessionEventType.NewMessage,
                session: this,
                message: message
            });
        }

        this.sync2Cache("receive message");
    }

    private getSID(): string {
        if (this.Type === 2) {
            return this.To;
        }

        let lg = Account.getInstance().getUID();
        let sm = this.To;

        if (lg < sm) {
            let tmp = lg;
            lg = sm;
            sm = tmp;
        }
        return lg + "_" + sm;
    }

    public send(content: string, type: number): Observable<ChatMessage> {
        const m: Message = {
            cliMid: uuid(32, 16),
            content: content,
            from: Account.getInstance().getUID(),
            mid: 0,
            sendAt: Date.now(),
            seq: 0,
            to: this.To,
            type: type,
            status: 0
        };
        const chatMessage: ChatMessageInternal = createChatMessage2(
            this.ID,
            m,
            this.isGroup()
        );
        chatMessage.setSendingStatus(SendingStatus.Sending);
        const sendObservable = this.createSendObservable(chatMessage, m);
        return sendObservable.pipe(
            timeout(10000),
            catchError((err) => {
                // 抛出消息发送失败的异常, 类型为 SendErrorCause.Forbidden 时, 表示 ticket 有问题
                if (isMessageSendError(err) && err.errorCause === SendErrorCause.Forbidden) {
                    // 清空缓存 Ticket, 返回发送 observable 再次尝试发送
                    this.Ticket = "";
                    return sendObservable;
                }
                // 分开两个 catchError 是因为, ticket 问题时, 需要重试一次, 并且重试的错误还要处理
                return throwError(() => err);
            }),
            catchError((err) => {
                Logger.error(
                    this.tag,
                    [chatMessage],
                    "send message error",
                    err
                );
                chatMessage.setSendingStatus(SendingStatus.Failed);
                chatMessage.setFailedReason(err.message || err.toString());
                this.event.next({
                    type: SessionEventType.MessageUpdate,
                    session: this,
                    message: chatMessage
                });
                this.syncMessage2Cache(chatMessage);

                return throwError(() => err);
            }),
            tap((resp) => {
                Logger.log(this.tag, "message send state changed", [resp]);
                switch (resp.action) {
                    case Actions.AckMessage:
                        chatMessage.setMid(resp.mid);
                        chatMessage.setSendingStatus(SendingStatus.ClientAck);
                        break;
                    case Actions.AckNotify:
                        chatMessage.setSendingStatus(SendingStatus.ServerAck);
                        break;
                    default:
                        Logger.warn(
                            this.tag,
                            "unknown action",
                            [resp],
                            resp.action
                        );
                        return;
                }
                // update cache after send success
                this.syncMessage2Cache(chatMessage);

                this.event.next({
                    type: SessionEventType.MessageUpdate,
                    session: this,
                    message: chatMessage
                });
                return chatMessage;
            }),
            map((resp) => chatMessage)
        );
    }

    update(session: SessionBaseInfo | SessionBean) {
        Logger.log(this.tag, "update", [session]);
        if (this.isSessionBaseInfo(session)) {
            this.Avatar = session.Avatar;
            this.Title = session.Title;
            this.UpdateAt = session.UpdateAt;
            this.LastMessage = session.LastMessage;
            this.LastMessageSender = session.LastMessageSender;
            this.UnreadCount = session.UnreadCount;
            this.Type = session.Type;
            this.To = session.To;
            this.ID = this.getSID();
            this.sync2Cache("update session");
        } else {
            Logger.warn(
                this.tag,
                "update session with session bean not implement",
                [session]
            );
        }
    }

    syncMessage2Cache(chatMessage: ChatMessage) {
        this.cache.updateMessage(chatMessage).subscribe({
            next: () => {
                Logger.log(this.tag, "message updated", chatMessage.CliMid);
            }
        });
    }

    sync2Cache(cause?: string) {
        this.cache.setSession(this).subscribe({
            next: () => {
                Logger.log(
                    this.tag,
                    "session updated",
                    this.ID,
                    "cause",
                    cause
                );
            },
            error: (err) => {
                Logger.error(
                    this.tag,
                    "session update failed",
                    "cause",
                    cause,
                    err
                );
            }
        });
    }

    private isSessionBaseInfo(
        session: SessionBaseInfo | SessionBean
    ): session is SessionBaseInfo {
        return (session as SessionBaseInfo).ID !== undefined;
    }

    private createSendObservable(chatMessage: ChatMessageInternal, m: Message): Observable<MessageSendResult> {

        const getTicketOb = of("").pipe(
            mergeMap(() => {
                // 本地有 Ticket 直接使用
                if (this.Ticket) {
                    return of(this.Ticket);
                }
                // 本地没有 Ticket 从服务器获取
                return Api.getTicket(this.To).pipe(
                    map((resp) => resp.Ticket)
                    // TODO 接口获取 ticket 失败, 重新抛出异常, 并附加原因在下游处理
                );
            }),
            tap((ticket) => {
                // 缓存 Ticket, 更新到数据库 ???
                this.Ticket = ticket;
            })
        );

        let sendObservable: Observable<MessageSendResult>;
        switch (this.Type) {
            case SessionType.Single:
                sendObservable = getTicketOb.pipe(
                    mergeMap((ticket) =>
                        IMWsClient.sendChatMessage(m, ticket)
                    )
                );
                break;
            case SessionType.Channel:
                sendObservable = getTicketOb.pipe(
                    mergeMap((ticket) =>
                        IMWsClient.sendChannelMessage(m, ticket)
                    )
                );
                break;
            default:
                return throwError(() => new Error("unknown session type"));
        }

        // add to cache
        this.cache.addMessage(chatMessage).subscribe({
            next: () => {
                this.addMessage(chatMessage);
            },
            error: (err) => {
                Logger.error(this.tag, [chatMessage], "add message error", err);
            }
        });

        return sendObservable;
    }
}

function uuid(len, radix): string {
    const chars =
        "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".split(
            ""
        );
    let uuid = [],
        i;
    radix = radix || chars.length;

    if (len) {
        // Compact form
        for (i = 0; i < len; i++) uuid[i] = chars[0 | (Math.random() * radix)];
    } else {
        // rfc4122, version 4 form
        let r;

        // rfc4122 requires these characters
        uuid[8] = uuid[13] = uuid[18] = uuid[23] = "-";
        uuid[14] = "4";

        // Fill in random data.  At i==19 set the high bits of clock sequence as
        // per rfc4122, sec. 4.1.5
        for (i = 0; i < 36; i++) {
            if (!uuid[i]) {
                r = 0 | (Math.random() * 16);
                uuid[i] = chars[i === 19 ? (r & 0x3) | 0x8 : r];
            }
        }
    }

    return uuid.join("").replaceAll("-", "").toUpperCase();
}
