import { Account } from './account';
import { Message, MessageStatus, MessageType, Reply } from './message';
import { Cache } from './cache';
import { map, Observable, scan, Subject, throwError } from 'rxjs';
import { GlideBaseInfo } from './def';
import { Logger } from '../utils/Logger';

export enum SendingStatus {
    Unknown,
    Sending,
    ServerAck,
    ClientAck,
    Failed,
}

export interface MessageBaseInfo {
    readonly Mid: number;
    readonly CliMid: string;
    readonly SID: string;
    readonly From: string;
    readonly To: string;
    readonly Content: string;
    readonly Type: MessageType;
    readonly Seq: number;
    readonly SendAt: number;
    readonly Status: MessageStatus;
    readonly ReceiveAt: number;
    readonly IsGroup: boolean;
    readonly Target: string;
    readonly UpdateAt: number;

    readonly FromMe: boolean;
    readonly OrderKey: number;
    readonly Sending: SendingStatus;
    readonly FailedReason?: string;
}

export enum MessageUpdateType {
    Initial,
    UpdateContent,
    Delete,
    UpdateStatus,
    UpdateSending,
}

export interface ChatMessageUpdateEvent {
    readonly message: ChatMessage
    readonly type: MessageUpdateType
}

export interface ChatMessage extends MessageBaseInfo {

    // 回复消息时不为空, 返回回复的消息
    getReplyMessage(): ChatMessage | null

    getSenderName(): string

    getId(): string

    getUserInfo(): Observable<GlideBaseInfo>

    // 返回消息的显示内容, detail为true时返回完整内容, 否则返回简略内容, 如图片消息返回[图片]
    getDisplayContent(detail: boolean): string

    toMessage(): Message

    // 撤回消息
    revoke(): Observable<void>

    events(): Observable<ChatMessageUpdateEvent>
}

export interface ChatMessageInternal extends ChatMessage {

    setMid(mid: number)

    setStatus(status: MessageStatus)

    setSendingStatus(sending: SendingStatus)

    setFailedReason(reason: string)

    update(message: Message | MessageBaseInfo)
}

export interface ChatMessageCache {

    addMessage(message: MessageBaseInfo): Observable<void>

    addMessages(messages: MessageBaseInfo[]): Observable<void>

    updateMessage(message: MessageBaseInfo): Observable<void>

    updateMessageStatus(cliId: number, status: MessageStatus): Observable<void>

    deleteMessage(cliId: string): Observable<void>

    deleteMessageBySid(sid: string): Observable<void>

    getMessageByCliId(cliId: string): Observable<MessageBaseInfo | null>

    getMessageByMid(mid: number): Observable<MessageBaseInfo | null>

    getSessionMessagesByTime(sid: string, beforeTime: number): Observable<MessageBaseInfo[]>

    getSessionMessageBySeq(sid: string, beforeSeq: number): Observable<MessageBaseInfo | null>

    getLatestSessionMessage(sid: string): Observable<MessageBaseInfo | null>
}

interface StreamMessageSegment {
    content: string
    seq: number
}


export function createChatMessage(info: MessageBaseInfo): ChatMessageInternal {
    const ret = new ChatMessageImpl();
    for (const key in ret) {
        if (info.hasOwnProperty(key)) {
            ret[key] = info[key]
        }
    }
    ret.IsGroup = info.IsGroup
    ret.init()
    return ret;
}

export function createChatMessage2(sid: string, m: Message, isChannel?: boolean): ChatMessageInternal {
    const ret = new ChatMessageImpl();
    ret.SID = sid
    ret.From = m.from;
    ret.To = m.to;
    ret.Content = m.content;
    ret.Mid = m.mid;
    ret.SendAt = m.sendAt;
    ret.Status = m.status
    ret.Type = m.type
    ret.CliMid = m.cliMid
    ret.OrderKey = m.sendAt
    ret.Seq = m.seq
    ret.IsGroup = isChannel ?? false
    ret.init()
    return ret;
}

class ChatMessageImpl implements ChatMessageInternal {

    private tag = "ChatMessageImpl"

    public ReceiveAt: number;

    public SID: string;
    public CliMid: string;
    public From: string;
    public To: string;
    public Content: string;
    public Mid: number;
    public Seq: number;
    public SendAt: number;

    public Status: number;
    public IsGroup: boolean;
    public Type: number;
    public Target: string;
    public UpdateAt: number;

    public FromMe: boolean;
    public OrderKey: number;
    public Sending: SendingStatus = SendingStatus.Unknown;
    public FailedReason?: string;

    private replyMessage: Reply = null

    private streamMessageSource: Subject<StreamMessageSegment> = null
    private eventSubject = new Subject<ChatMessageUpdateEvent>();

    constructor() {
        this.UpdateAt = 0
    }

    init() {

        this.Mid = this.Mid || -1
        this.Content = this.Content || ""
        this.Target = this.FromMe ? this.To : this.From
        this.FromMe = this.From === Account.getInstance().getUID();
        this.SendAt = this.SendAt > 10000000000 ? this.SendAt : this.SendAt * 1000

        if (this.Type === MessageType.Reply) {
            this.replyMessage = JSON.parse(this.Content)
            // this.Content = this.replyMessage.content
        }

        if (this.Type === MessageType.StreamMarkdown || this.Type === MessageType.StreamText) {
            if (this.Status === MessageStatus.StreamFinish || this.Status === MessageStatus.StreamCancel) {
                return
            }
            this.streamMessageSource = new Subject<StreamMessageSegment>()
            this.streamMessageSource.pipe(
                scan((acc, value) => {
                    acc.push(value)
                    return acc
                    // sort by seq
                    // const insertAt = acc.findIndex((v) => {
                    //     return v.seq > value.seq
                    // })
                    // if (insertAt === -1) {
                    //     acc.push(value)
                    //     return acc
                    // } else {
                    //     return acc.splice(insertAt, 0, value, ...acc.splice(insertAt))
                    // }
                }, new Array<StreamMessageSegment>()),
                map((value) => {
                    return value.sort((a, b) => a.seq - b.seq).map((v) => {
                        return v.content
                    }).join("")
                })
            ).subscribe({
                next: (message) => {
                    this.Content = message
                    Logger.log(this.tag, "stream message update", message)
                    this.eventSubject.next({
                        message: this as ChatMessage,
                        type: MessageUpdateType.UpdateContent
                    })
                },
                error: (err) => {
                    Logger.error(this.tag, "stream message error", err)
                }
            })
        }
    }

    events(): Subject<ChatMessageUpdateEvent> {
        return this.eventSubject;
    }

    public getId(): string {
        // TODO fixme
        return this.CliMid ?? this.Mid.toString();
    }

    public getUserInfo(): Observable<GlideBaseInfo> {
        switch (this.Type) {
            case 100:
            case 101:
                return Cache.loadUserInfo1(this.Content)
        }
        return Cache.loadUserInfo1(this.From)
    }

    public getSenderName(): string {
        if (this.FromMe) {
            return "我"
        }
        const userInfo = Cache.getUserInfo(this.From) ?? {
            name: "-"
        }
        return userInfo.name;
    }

    public getDisplayContent(detail: boolean = false): string {
        switch (this.Type) {
            case 100:
            case 101:
                const userInfo = Cache.getUserInfo(this.Content)
                const name = userInfo === null ? this.Content : userInfo.name
                const isMe = this.Content === Account.getInstance().getUID()
                if (this.Type === 100) {
                    return isMe ? "你已加入频道" : `${name} 加入频道`;
                }
                return isMe ? "你已离开频道" : `${name} 离开频道`;
            // case MessageType.StreamMarkdown:
            // case MessageType.StreamText:
            //     return '[流消息]'
            case MessageType.Image:
                return '[图片]'
            case MessageType.Audio:
                return '[声音]'
            case MessageType.Location:
                return '[位置]'
            case MessageType.File:
                return '[文件]'
            case MessageType.Reply:
                if (detail) {
                    return this.replyMessage.content
                }
                return "[回复消息]" + this.replyMessage.content
            default:
                return this.Content === undefined ? '-' : this.Content;
        }
    }

    private updateStreamMessage(m: ChatMessage) {
        if (m.Type !== MessageType.StreamMarkdown && m.Type !== MessageType.StreamText) {
            Logger.log(this.tag, "update a non stream message")
            return;
        }
        this.Status = m.Status
        switch (m.Status) {
            case MessageStatus.StreamStart:
                this.eventSubject.next({
                    message: this,
                    type: MessageUpdateType.UpdateStatus
                })
                break;
            case MessageStatus.StreamSending:
                this.streamMessageSource?.next({
                    seq: m.Seq,
                    content: m.Content
                })
                break;
            case MessageStatus.StreamFinish:
                setTimeout(() => {
                    this.eventSubject.next({
                        message: this,
                        type: MessageUpdateType.UpdateStatus
                    })
                }, 1000)
                break;
            case MessageStatus.StreamCancel:
                this.Content = m.Content
                setTimeout(() => {

                    this.eventSubject.next({
                        message: this,
                        type: MessageUpdateType.UpdateStatus
                    })
                }, 1000)
                break;
            default:
        }
    }

    public revoke(): Observable<void> {
        // TODO 先获取消息所属会话, 然后通过会发送撤回消息
        return throwError(() => new Error("not implemented"))
    }

    public setFailedReason(reason: string) {
        this.FailedReason = reason
    }

    public setSendingStatus(sending: SendingStatus) {
        this.Sending = sending
    }

    public setMid(mid: number) {
        this.Mid = mid
    }

    public setStatus(status: MessageStatus) {
        this.Status = status
        this.eventSubject.next({
            message: this,
            type: MessageUpdateType.UpdateStatus
        })
    }

    public update(m: ChatMessage): void {

        Logger.log(this.tag, "update message", [this.Content], [m.Content])

        if (m.Type === MessageType.StreamMarkdown || m.Type === MessageType.StreamText) {
            this.UpdateAt = Date.now()
            this.updateStreamMessage(m)
            return;
        }

        // this.From = m.From;
        // this.To = m.To;
        this.Content = m.Content;
        // this.Mid = m.Mid;
        // this.SendAt = m.SendAt;
        this.Status = m.Status;
        // this.Type = m.Type;
        // this.OrderKey = m.SendAt
        // this.Sending = m.Sending
        // this.Seq = m.Seq
        // this.ReceiveAt = m.ReceiveAt
    }

    public getReplyMessage(): ChatMessage | null {
        if (this.Type !== MessageType.Reply) {
            return null
        }
        return createChatMessage2(this.SID, this.replyMessage.replyTo, false)
    }

    public toMessage(): Message {
        return {
            cliMid: this.CliMid,
            mid: this.Mid,
            from: this.From,
            to: this.To,
            content: this.Content,
            sendAt: this.SendAt,
            status: this.Status,
            type: this.Type,
            seq: this.Seq
        }
    }
}
