import {
    ActionChatMessage,
    ActionGroupMessage,
    ActionUserChatHistory,
    ActionUserChatInfo,
    ChatHistoryRequest,
    IChat,
    IChatMessage,
    SendChatMessage,
    UserInfo
} from "./message";
import {Ws} from "./ws";
import {client} from "./client";
import {Group} from "./group";
import {SessionBean} from "../api/model";

export class OldSession {

    public Avatar: string;
    public UcId: number = -1
    public ChatType: number;
    public ID: string;
    public LatestMsg: string;
    public NewMessageAt: any;
    public ReadAt: any;
    public Target: number;
    public Title: string;
    public Unread: number = 0

    private messages: ChatMessage[] = []
    private messageListener: (m: ChatMessage) => void = (() => null)
    private updateListener: (c: OldSession) => void = (() => null)

    public static create(c: SessionBean): OldSession {
        const ret = new OldSession()
        ret.ID = c.Uid1 + "-" + c.Uid2
        ret.ChatType = 1
        return ret
    }

    public getLastMessage(): ChatMessage | null {
        if (this.messages.length === 0) {
            return null
        }
        return this.messages[this.messages.length - 1]
    }

    public init(): Promise<OldSession> {
        console.log("Chat/init", this.ID)
        if (this.UcId <= 0) {
            return Ws.request<OldSession>(ActionUserChatInfo, {Cid: this.ID})
                .then(value => {
                    // this.update(value)
                    return this.init()
                })
                .catch(reason => client.catchPromiseReject(reason))
        }
        this.setTitle()
        this.messages = []
        return this.loadHistory()
            .then(() => this)
            .finally(() => {
                console.log("Chat/init", 'completed')
            })
    }

    public getTargetObj(): UserInfo | Group | null {
        let ret = null
        switch (this.ChatType) {
            case 1:
                ret = client.contactsList.getFriend(this.Target)
                break
            case 2:
                ret = client.contactsList.getGroup(this.Target)
                break
        }
        return ret
    }

    public sendMessage(msg: string, onSuc?: (msg) => void) {
        console.log("Chat/sendMessage", msg)
        let m2: SendChatMessage = {
            Cid: this.ID,
            UcId: this.UcId,
            Message: msg,
            MessageType: 1,
            TargetId: this.Target,
            SendAt: Date.now()
        }
        const action = this.ChatType === 1 ? ActionChatMessage : ActionGroupMessage
        Ws.sendMessage(action, m2, ((success, result, msg1) => {
            if (onSuc) {
                onSuc(result)
            }
        }))
    }

    public onNewMessage(message: ChatMessage) {
        console.log("Chat/onNewMessage", message)
        this.messages.push(message)

        this.LatestMsg = message.Message
        if (this.messageListener) {
            this.messageListener(message)
        }
    }

    public setUpdateListener(o: (m: OldSession) => void) {
        this.updateListener = o
    }

    public setMessageListener(l: (m: ChatMessage) => void) {
        this.messageListener = l
    }

    public loadHistory(): Promise<ChatMessage[]> {
        console.log("Chat/loadHistory", this.ID)
        let time = Date.now();
        if (this.messages.length > 0) {
            time = this.messages[this.messages.length - 1].SendAt
        }
        const req: ChatHistoryRequest = {Cid: this.ID, Time: time, Type: this.ChatType}

        return Ws.request<ChatMessage[]>(ActionUserChatHistory, req)
            .then(value => {
                value.forEach((v) => {
                    this.messages.push(v)
                })
                this.sortMessage()
                if (this.messages.length > 0) {
                    this.LatestMsg = this.messages[this.messages.length - 1].Message
                }
                return value
            })
            .finally(() => {
                console.log('Chat/loadHistory', 'completed')
            })
    }

    public getMessage(): ChatMessage[] {
        return this.messages
    }

    public update(chat: IChat) {
        this.ID = chat.Cid
        this.UcId = chat.UcId
        this.Target = chat.Target
        this.ChatType = chat.ChatType
        this.Unread = chat.Unread
        this.Avatar = chat.Avatar
        this.ReadAt = chat.ReadAt
        this.NewMessageAt = chat.NewMessageAt
        this.LatestMsg = chat.LatestMsg
        this.setTitle()
        this.updateListener(this)
    }

    private setTitle() {
        switch (this.ChatType) {
            case 1:
                const ui = client.contactsList.getFriend(this.Target) ?? client.getCachedUserInfo(this.Target)
                this.Title = ui?.Nickname ?? "不是好友"
                break
            case 2:
                this.Title = client.contactsList.getGroup(this.Target)?.Name ?? "未知群"
                break
        }
    }

    private sortMessage() {
        this.messages.sort(((a, b) => a.SendAt > b.SendAt ? 1 : -1))
    }
}

export class ChatMessage implements IChatMessage {

    public Mid: number = -1
    public Message: string = ""
    public Cid: string = ""
    public MessageType: number
    public SendAt: number
    public Sender: number


    public static create(src: IChatMessage): ChatMessage {
        const ret = new ChatMessage()
        ret.Mid = src.Mid
        ret.Message = src.Message
        ret.Cid = src.Cid
        ret.MessageType = src.MessageType
        ret.SendAt = src.SendAt
        ret.Sender = src.Sender
        return ret
    }

    public getMessageExtra(): string {
        const userInfo = client.getCachedUserInfo(this.Sender);
        if (userInfo != null) {
            return userInfo.Nickname + ': ' + this.Message
        }
        return this.Sender + ': ' + this.Message
    }
}
