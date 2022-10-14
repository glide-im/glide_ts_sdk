import {MessageBean} from "src/api/model";
import {Account} from "./account";
import {Message, MessageType} from "./message";

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

    public From: string;
    public To: string;
    public Content: string;
    public Mid: number;
    public SendAt: number;

    public Status: number;
    public IsMe: boolean;
    public IsGroup: boolean;
    public Type: number;
    public Target: string;

    public OrderKey: number;

    public Sending: SendingStatus = SendingStatus.Unknown;

    private updateListener: MessageUpdateListener | null = null;

    public setUpdateListener(l: MessageUpdateListener): void {
        this.updateListener = l;
    }

    public static create2(m: MessageBean, type: number): ChatMessage {
        const ret = new ChatMessage();
        ret.From = m.From.toString();
        ret.To = m.To.toString();
        ret.Content = m.Content;
        ret.Mid = m.Mid;
        ret.SendAt = m.SendAt;
        ret.IsMe = ret.From === Account.getInstance().getUID();
        ret.Status = m.Status
        ret.Target = ret.IsMe ? ret.To : ret.From
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
        ret.IsMe = m.from === Account.getInstance().getUID();
        ret.Status = m.status
        ret.Type = m.type
        ret.Target = ret.IsMe ? m.to : m.from
        ret.OrderKey = m.sendAt
        return ret;
    }

    public getDisplayContent(): string {
        switch (this.Type) {
            case 100:
                return `用户 ${this.Content} 上线`;
            case 101:
                return `用户 ${this.Content} 离开`;
            case MessageType.Image:
                return '[图片]'
            case MessageType.Audio:
                return '[声音]'
            case MessageType.Location:
                return '[位置]'
            case MessageType.File:
                return '[文件]'
            default:
                return this.Content;
        }
    }

    public update(m: ChatMessage): void {
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

        if (this.updateListener) {
            this.updateListener(this);
        }
    }
}
