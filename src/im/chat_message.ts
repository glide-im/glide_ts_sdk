import { Account } from "./account";
import { Message, MessageStatus, MessageType } from "./message";
import { Cache } from "./cache";
import { Observable } from "rxjs";
import { IMUserInfo } from "./def";
import { MessageBean } from "../api/model";

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

    public addUpdateListener(l: MessageUpdateListener): () => void {
        this.updateListener.push(l)
        return () => {
            this.updateListener = this.updateListener.filter((v) => v !== l)
        }
    }

    public static create2(m: MessageBean, type: number): ChatMessage {
        const ret = new ChatMessage();
        ret.From = m.From.toString();
        ret.To = m.To.toString();
        ret.Content = m.Content;
        ret.Mid = m.Mid;
        ret.SendAt = m.SendAt;
        ret.FromMe = ret.From === Account.getInstance().getUID();
        ret.Status = m.Status
        ret.Target = ret.FromMe ? ret.To : ret.From
        ret.OrderKey = m.SendAt
        return ret;
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
        return ret;
    }

    public getDisplayTime(): string {
        const date = new Date(this.SendAt);
        return date.getHours() + ":" + date.getMinutes();
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
        const userInfo = Cache.getUserInfo(this.From) ?? {
            name: "-"
        }
        return userInfo.name;
    }

    public getDisplayContent(): string {
        switch (this.Type) {
            case 100:
                const userInfo = Cache.getUserInfo(this.Content)?.name ?? this.Content
                return this.FromMe ? "你已加入频道" : `${userInfo} 加入频道`;
            case 101:
                const userInfo1 = Cache.getUserInfo(this.Content) ?? this.Content
                return this.FromMe ? "你已离开频道" : `${userInfo1} 离开频道`;
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
                this.streamMessages = this.streamMessages.sort((a, b) => {
                    return a.Seq - b.Seq
                })
                this.Content = this.streamMessages.map((m) => m.Content).join("")
                break;
            case MessageStatus.StreamFinish:
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
        if(m.Type === MessageType.StreamMarkdown || m.Type === MessageType.StreamText){
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
}
