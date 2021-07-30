import {
    ActionChatMessage,
    ActionUserChatHistory,
    ActionUserChatInfo,
    ChatHistoryRequest,
    IChat,
    IChatMessage,
    SendChatMessage
} from "./message";
import {Ws} from "./ws";
import {client} from "./client";

export class Chat implements IChat {

    public Avatar: string;
    public UcId: number = -1
    public ChatType: number;
    public Cid: number;
    public LatestMsg: string;
    public NewMessageAt: any;
    public ReadAt: any;
    public Target: number;
    public Title: string;
    public Unread: number = 0

    private messages: ChatMessage[] = []
    private messageListener: (m: ChatMessage) => void = (() => null)
    private updateListener: (c: Chat) => void = (() => null)

    public static create(c: IChat): Chat {
        const ret = new Chat()
        ret.update(c)
        return ret
    }

    public init(onUpdate: (c: Chat) => void) {

        console.log("Chat/init", this.Cid)
        if (this.UcId <= 0) {
            Ws.sendMessage<Chat>(ActionUserChatInfo, {Cid: this.Cid}, ((success, result, msg) => {
                if (!success) {
                    console.log(msg)
                    return
                }
                this.update(result)
                this.init(onUpdate)
            }))
        }
        this.Title = client.getChatTitle(this.Target, this.ChatType)
        this.messages = []
        this.loadHistory(() => {
            onUpdate(this)
        })
    }

    public sendMessage(msg: string, onSuc: (msg) => void) {
        console.log("Chat/sendMessage", msg)
        let m2: SendChatMessage = {
            Cid: this.Cid,
            UcId: this.UcId,
            Message: msg,
            MessageType: 1,
            Receiver: this.Target
        }
        Ws.sendMessage(ActionChatMessage, m2, ((success, result, msg1) => {
            onSuc(result)
        }))
    }

    public onNewMessage(message: ChatMessage) {
        console.log("Chat/onNewMessage", message)
        this.messages.push(message)

        this.LatestMsg = message.Message
        this.messageListener(message)
    }

    public setUpdateListener(o: (m: Chat) => void) {
        this.updateListener = o
    }

    public setMessageListener(l: (m: ChatMessage) => void) {
        this.messageListener = l
    }

    public loadHistory(onSuc: (m: ChatMessage[]) => void) {
        console.log("Chat/loadHistory", this.Cid)
        let time = Date.now();
        if (this.messages.length > 0) {
            time = this.messages[this.messages.length - 1].SendAt
        }
        const req: ChatHistoryRequest = {Cid: this.Cid, Time: time, Type: this.ChatType}

        Ws.request<ChatMessage[]>(ActionUserChatHistory, req)
            .then(value => {
                if (!value.success) {
                    console.log(value.msg)
                    return
                }
                value.result.forEach((v) => {
                    this.messages.push(v)
                })
                this.sortMessage()
                if (this.messages.length > 0) {
                    this.LatestMsg = this.messages[this.messages.length - 1].Message
                }
                onSuc(value.result)
            })
    }

    public getMessage(): ChatMessage[] {
        return this.messages
    }

    public update(chat: IChat) {
        console.log("Chat/update", chat.Cid)
        this.Cid = chat.Cid
        this.UcId = chat.UcId
        this.Target = chat.Target
        this.ChatType = chat.ChatType
        this.Unread = chat.Unread
        this.Avatar = chat.Avatar
        this.ReadAt = chat.ReadAt
        this.NewMessageAt = chat.NewMessageAt
        this.LatestMsg = chat.LatestMsg
        this.Title = client.getChatTitle(this.Target, this.ChatType)
        if (this.Title === "-") {
            this.Title = `${chat.Cid}-${chat.Target}`
        }
        this.updateListener(this)
    }

    private sortMessage() {
        this.messages.sort(((a, b) => a.SendAt > b.SendAt ? 1 : -1))
    }
}

export class ChatMessage implements IChatMessage {
    public Mid: number = -1
    public Message: string = ""
    public Cid: number
    public MessageType: number
    public SendAt: number
    public SenderUid: number
}
