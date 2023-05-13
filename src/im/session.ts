import {delay, filter, interval, map, mergeMap, Observable, of, Subject, take, throwError} from "rxjs";
import {SessionBean} from "../api/model";
import {Account} from "./account";
import {ChatMessage, ChatMessageCache, SendingStatus} from "./chat_message";
import {Cache} from "./cache";
import {Actions, Message, MessageType} from "./message";
import {IMWsClient} from "./im_ws_client";
import {Event} from "./session_list";
import {time2HourMinute} from "../utils/TimeUtils";
import {onNext} from "../rx/next";
import {Logger} from "../utils/Logger";

export type SessionId = string

export enum SessionType {
    Single = 1,
    Channel = 2
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
    readonly UpdateAt: string;
    readonly LastMessageSender: string;
    readonly LastMessage: string;
    readonly UnreadCount: number;
    readonly Type: SessionType;
    readonly To: string;
}

export interface ISession extends SessionBaseInfo {

    readonly messageSubject: Subject<ChatMessage>;
    readonly updateSubject: Subject<Event>;

    waitInit(): Observable<InternalSession>;

    clearUnread(): void;

    sendTextMessage(content: string): Observable<ChatMessage>;

    sendImageMessage(url: string): Observable<ChatMessage>;

    send(content: string, type: number): Observable<ChatMessage>;

    getMessages(): ChatMessage[]

    getMessageHistory(beforeMid: number | null): Observable<ChatMessage[]>
}

export interface InternalSession extends ISession {
    onMessage(action: Actions, message: Message)

    update(session: SessionBaseInfo)

    update(session: SessionBean)

    init(cache: ChatMessageCache): Observable<InternalSession>;
}

export function createSession(to: string, type: SessionType): InternalSession {
    return InternalSessionImpl.create(to, type);
}

export function fromSessionBean(sessionBean: SessionBean): InternalSession {
    return InternalSessionImpl.fromSessionBean(sessionBean);
}

export function fromBaseInfo(baseInfo: SessionBaseInfo): InternalSession {
    return InternalSessionImpl.fromBaseInfo(baseInfo);
}

class InternalSessionImpl implements InternalSession {

    private tag = "InternalSessionImpl";

    public ID: SessionId;
    public Avatar: string;
    public Title: string;
    public UpdateAt: string;
    public LastMessageSender: string;
    public LastMessage: string;
    public UnreadCount: number = 0;
    public Type: SessionType;
    public To: string;

    private messageList = new Array<ChatMessage>();
    private messageMap = new Map<string, ChatMessage>();

    private readonly _messageSubject: Subject<ChatMessage> = new Subject<ChatMessage>();
    private readonly _updateSubject: Subject<Event> = new Subject<Event>();

    private initialized = false;

    private constructor() {

    }

    get messageSubject(): Subject<ChatMessage> {
        return this._messageSubject;
    }

    get updateSubject(): Subject<Event> {
        return this._updateSubject;
    }

    private isSelected(): boolean {
        return this.ID === Account.session().getCurrentSession()?.ID;
    }

    public static create(to: string, type: number): InternalSessionImpl {
        const ret = new InternalSessionImpl();
        ret.To = to;
        ret.Type = type;
        ret.ID = ret.getSID();
        ret.Title = ret.ID;
        ret.LastMessage = "-"
        ret.LastMessageSender = "-"
        if (type === 1) {
            ret.Title = Cache.getUserInfo(to)?.name ?? ret.ID;
        }
        return ret;
    }

    public static fromSessionBean(sb: SessionBean): InternalSessionImpl {
        let session = new InternalSessionImpl();
        session.To = sb.To.toString();
        session.ID = session.getSID();
        session.Title = session.ID;
        session.UpdateAt = sb.UpdateAt.toString();
        session.LastMessageSender = "-";
        session.LastMessage = '-';
        session.UnreadCount = 0;
        session.Type = SessionType.Single;
        return session;
    }

    public static fromBaseInfo(baseInfo: SessionBaseInfo): InternalSessionImpl {
        let session = new InternalSessionImpl();
        session.To = baseInfo.To;
        session.ID = baseInfo.ID;
        session.Title = baseInfo.Title;
        session.UpdateAt = baseInfo.UpdateAt;
        session.LastMessageSender = baseInfo.LastMessageSender;
        session.LastMessage = baseInfo.LastMessage;
        session.UnreadCount = baseInfo.UnreadCount;
        session.Type = baseInfo.Type;
        return session;
    }

    waitInit(): Observable<InternalSession> {
        return interval(100).pipe(
            filter(() => this.initialized),
            take(1),
            map(() => this)
        )
    }

    public clearUnread() {
        this.UnreadCount = 0;
        this.updateSubject.next(Event.update);
    }

    public init(cache: ChatMessageCache): Observable<InternalSession> {

        const initBaseInfo = this.isGroup() ? of(Cache.getChannelInfo(this.ID)) : Cache.loadUserInfo1(this.To)

        if (this.To === "the_world_channel") {
            of("Hi, 我来了").pipe(
                delay(2000),
                mergeMap(msg => this.sendTextMessage(msg)),
            ).subscribe({
                next: (msg) => Logger.log(this.tag, 'hello message sent'),
                error: (err) => Logger.error(this.tag, 'hello message send failed', err)
            })
        }

        return initBaseInfo.pipe(
            map((info) => {
                Logger.log(this.tag, "init session ", info.id, info.name, info.avatar)
                this.Title = info.name ?? this.To
                this.Avatar = info.avatar ?? "-"
                this.updateSubject.next(Event.update)
                return this
            }),
            onNext(() => {
                this.initialized = true
            })
        )
    }

    public isGroup(): boolean {
        return this.Type === SessionType.Channel;
    }

    public getMessageHistory(beforeMid: number | null): Observable<ChatMessage[]> {

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


    public onMessage(action: Actions, message: Message) {
        if (message.type > MessageType.WebRtcHi) {
            return;
        }

        const c = ChatMessage.create(this.ID, message)

        // todo filter none-display message

        Logger.log(this.tag, "onMessage", this.ID, message.mid, message.type, [message]);
        // TODO 优化
        Cache.cacheUserInfo(message.from).then(() => {
            this.addMessageByOrder(c);
        })
    }

    public sendTextMessage(msg: string): Observable<ChatMessage> {
        return this.send(msg, MessageType.Text);
    }

    public sendImageMessage(img: string): Observable<ChatMessage> {
        return this.send(img, MessageType.Image)
    }

    public getMessages(): ChatMessage[] {
        return Array.from(this.messageMap.values());
    }

    private getMessageBeforeMid(mid: number): ChatMessage[] {
        if (this.messageList.length === 0) {
            return [];
        }

        let index = 0;
        if (mid !== 0) {
            index = this.messageList.findIndex(msg => msg.Mid <= mid);
            if (index === -1) {
                return [];
            }
        }

        return this.messageList.slice(index, this.messageList.length - index);
    }

    private addMessageByOrder(message: ChatMessage) {

        const isNewMessage = !this.messageMap.has(message.getId());

        if (!isNewMessage) {
            this.messageMap.get(message.getId())?.update(message);
        } else {
            let index = this.messageList.findIndex(msg => msg.OrderKey > message.OrderKey);
            this.messageMap.set(message.getId(), message);
            if (index === -1) {
                this.messageList.push(message);
            } else {
                this.messageList.splice(index, 0, message);
            }
        }

        // 收到老消息
        // const isNotHistoryMessage = this.messageList[this.messageList.length - 1].getId() === message.getId()

        if (this.messageList.length > 0 && isNewMessage) {
            if (!message.FromMe && !this.isSelected()) {
                this.UnreadCount++;
            }

            this.LastMessage = message.getDisplayContent();
            this.LastMessageSender = message.getSenderName();

            this.UpdateAt = time2HourMinute(message.SendAt);
            this.messageSubject.next(message)
        }
        this.updateSubject.next(Event.update);
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
        const time = Date.now();
        const from = Account.getInstance().getUID();
        const m: Message = {
            cliMid: uuid(32, 16),
            content: content,
            from: from,
            mid: 0,
            sendAt: time,
            seq: 0,
            to: this.To,
            type: type,
            status: 0,
        };
        const r = ChatMessage.create(this.ID, m);
        r.Sending = SendingStatus.Sending;

        this.addMessageByOrder(r);

        let sendObservable: Observable<Message>
        switch (this.Type) {
            case SessionType.Single:
                sendObservable = IMWsClient.sendChatMessage(m)
                break;
            case SessionType.Channel:
                sendObservable = IMWsClient.sendChannelMessage(m)
                break;
            default:
                return throwError(() => new Error("unknown session type"));
        }

        return sendObservable.pipe(
            map(resp => {
                const r = ChatMessage.create(this.ID, resp);
                r.Sending = SendingStatus.Sent;
                this.addMessageByOrder(r);
                return r;
            })
        );
    }

    update(session: SessionBaseInfo);
    update(session: SessionBean);
    update(session: SessionBaseInfo | SessionBean) {
    }
}


function uuid(len, radix): string {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');
    let uuid = [], i;
    radix = radix || chars.length;

    if (len) {
        // Compact form
        for (i = 0; i < len; i++) uuid[i] = chars[0 | Math.random() * radix];
    } else {
        // rfc4122, version 4 form
        let r;

        // rfc4122 requires these characters
        uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
        uuid[14] = '4';

        // Fill in random data.  At i==19 set the high bits of clock sequence as
        // per rfc4122, sec. 4.1.5
        for (i = 0; i < 36; i++) {
            if (!uuid[i]) {
                r = 0 | Math.random() * 16;
                uuid[i] = chars[(i === 19) ? (r & 0x3) | 0x8 : r];
            }
        }
    }

    return uuid.join('');
}