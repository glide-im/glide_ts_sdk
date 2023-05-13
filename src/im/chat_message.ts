import {Account} from "./account";
import {Message, MessageStatus, MessageType} from "./message";
import {Cache} from "./cache";
import {Observable, Subject} from "rxjs";
import {GlideBaseInfo} from "./def";
import {Logger} from "../utils/Logger";

export enum SendingStatus {
    Unknown,
    Sending,
    Sent,
    Failed,
}

export interface MessageUpdateListener {
    (message: ChatMessage): void
}

export interface MessageBaseInfo {
    readonly SID: string;
    readonly CliId: string;
    readonly From: string;
    readonly To: string;
    readonly Content: string;
    readonly Mid: number;
    readonly Seq: number;
    readonly SendAt: number;
    readonly Status: number;
    readonly ReceiveAt: number;
    readonly IsGroup: boolean;
    readonly Type: number;
    readonly Target: string;
}

export interface IChatMessage {
    getDisplayTime(): string

    getSenderName(): string

    getId(): string

    getUserInfo(): Observable<GlideBaseInfo>

    getDisplayContent(): string
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

export class ChatMessage implements MessageBaseInfo {
    ReceiveAt: number;

    public SID: string;
    public CliId: string;
    public From: string;
    public To: string;
    public Content: string;
    public Mid: number;
    public Seq: number;
    public SendAt: number;

    public Status: number;
    public FromMe: boolean;
    public IsGroup: boolean;
    public Type: number;
    public Target: string;


    public OrderKey: number;

    public Sending: SendingStatus = SendingStatus.Unknown;

    private streamMessages = new Array<ChatMessage>();
    private updateListener: Array<MessageUpdateListener> = [];

    private streamMessageSubject = new Subject<ChatMessage>();

    public addUpdateListener(l: MessageUpdateListener): () => void {
        this.updateListener.push(l)
        return () => {
            this.updateListener = this.updateListener.filter((v) => v !== l)
        }
    }

    public static create(sid: string, m: Message): ChatMessage {
        const ret = new ChatMessage();
        ret.From = m.from;
        ret.To = m.to;
        ret.Content = m.content;
        ret.Mid = m.mid;
        ret.SendAt = m.sendAt;
        ret.FromMe = m.from === Account.getInstance().getUID();
        ret.Status = m.status
        ret.Type = m.type
        ret.CliId = m.cliMid
        ret.Target = ret.FromMe ? m.to : m.from
        ret.OrderKey = m.sendAt
        ret.Seq = m.seq

        if (ret.CliId === undefined || ret.CliId === "") {
            // TODO optimize
            if (ret.Mid === undefined) {
                return ret
            }
            ret.CliId = ret.Mid.toString()
        }
        return ret;
    }

    public getDisplayTime(): string {
        const date = new Date(this.SendAt);

        // format date like 19:01
        const hour = date.getHours();
        const minute = date.getMinutes();
        const hourStr = hour < 10 ? "0" + hour : hour.toString();
        const minuteStr = minute < 10 ? "0" + minute : minute.toString();
        return hourStr + ":" + minuteStr;
    }

    public getId(): string {
        // TODO fixme
        return this.CliId;
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

    public getDisplayContent(): string {
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
            case MessageType.Image:
                return '[图片]'
            case MessageType.Audio:
                return '[声音]'
            case MessageType.Location:
                return '[位置]'
            case MessageType.File:
                return '[文件]'
            default:
                return this.Content === undefined ? '-' : this.Content;
        }
    }

    public update2(m: ChatMessage) {
        if (m.Type !== MessageType.StreamMarkdown && m.Type !== MessageType.StreamText) {
            Logger.log("ChatMessage", "update a non stream message")
            return;
        }
        this.Status = m.Status
        switch (m.Status) {
            case MessageStatus.StreamStart:
                break;
            case MessageStatus.StreamSending:
                if (!this.Content) {
                    this.Content = ""
                }
                this.streamMessages.push(m)
                // TODO optimize, use rxjs to sort and join the stream messages
                //this.streamMessageSubject.next(m)
                this.streamMessages = this.streamMessages.sort((a, b) => {
                    return a.Seq - b.Seq
                })
                this.Content = this.streamMessages.map((m) => m.Content).join("")
                break;
            case MessageStatus.StreamFinish:
                setTimeout(() => {
                    this.streamMessages = []
                }, 2000)
                break;
            case MessageStatus.StreamCancel:
                this.Content = m.Content
                setTimeout(() => {
                    this.streamMessages = []
                }, 2000)
                break;
            default:
        }
        this.updateListener.forEach((l) => {
            l(this)
        })
    }

    public update(m: ChatMessage): void {
        if (m.Type === MessageType.StreamMarkdown || m.Type === MessageType.StreamText) {
            this.update2(m)
            return;
        }

        this.From = m.From;
        this.To = m.To;
        this.Content = m.Content;
        this.Mid = m.Mid;
        this.SendAt = m.SendAt;
        // this.IsMe = m.IsMe;
        this.Status = m.Status;
        this.Sending = m.Sending;
        this.Type = m.Type;
        this.OrderKey = m.SendAt

        this.updateListener.forEach((l) => {
            l(this)
        })
    }

    private initForStreamMessage() {
        this.streamMessageSubject.pipe(

        ).subscribe((m) => {
            this.Content = m.Content
        })
    }
}
