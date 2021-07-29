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
    private hasMoreMessage = true
    private messageListener: (m: ChatMessage) => void = (() => null)

    public static create(c: IChat): Chat {
        const ret = new Chat()
        ret.update(c)
        return ret
    }

    public init(onUpdate: (c: Chat) => void) {
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
        this.hasMoreMessage = true
        this.messages = []
        this.loadHistory(() => {
            onUpdate(this)
        })
    }

    public sendMessage(msg: string, onSuc: (msg) => void) {
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
        this.messages.sort(((a, b) => a.SendAt > b.SendAt ? 1 : -1))

        this.LatestMsg = message.Message
        this.messageListener(message)
    }

    public setMessageListener(l: (m: ChatMessage) => void) {
        this.messageListener = l
    }

    public loadHistory(onSuc: (m: ChatMessage[]) => void) {
        let time = Date.now();
        if (this.messages.length > 0) {
            time = this.messages[this.messages.length - 1].SendAt
        }
        const req: ChatHistoryRequest = {Cid: this.Cid, Time: time, Type: this.ChatType}

        Ws.sendMessage<ChatMessage[]>(ActionUserChatHistory, req,
            ((success, result, msg) => {
                if (!success) {
                    console.log(msg)
                    return
                }
                this.hasMoreMessage = false
                result.forEach((v) => {
                    this.messages.push(v)
                })
                onSuc(result)
            }))
    }

    public getMessage(): ChatMessage[] {
        return this.messages
    }

    public update(chat: IChat) {
        this.Cid = chat.Cid
        this.UcId = chat.UcId
        this.Target = chat.Target
        this.ChatType = chat.ChatType
        this.Unread = chat.Unread
        this.Avatar = chat.Avatar
        this.ReadAt = chat.ReadAt
        this.NewMessageAt = chat.NewMessageAt
        this.Title = client.getChatTitle(this.Target, this.ChatType)
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
