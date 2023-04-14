import {Account} from "./account";
import {Message, MessageStatus, MessageType} from "./message";
import {Cache} from "./cache";
import {Observable, Subject} from "rxjs";
import {IMUserInfo} from "./def";
import {MessageBean} from "../api/model";

export enum SendingStatus {
    Unknown,
    Sending,
    Sent,
    Failed,
}

export interface MessageUpdateListener {
    (message: ChatMessage): void
}

export class ChatMessage {

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

    public static create(m: Message): ChatMessage {
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
        const date = new Date(this.SendAt * 1000);

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

    public getUserInfo(): Observable<IMUserInfo> {
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
            console.log("update a non stream message")
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
