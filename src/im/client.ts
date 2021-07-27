import {Callback, Ws} from "./ws";
import {
    ActionChatMessage,
    ActionOnlineUser,
    ActionUserChatList,
    ActionUserLogin,
    ActionUserNewChat,
    ActionUserRegister,
    AuthResponse,
    Chat,
    SearchUser
} from "./message";
import {ChatMessage, SendChatMessage} from "../Model";

export class Client {

    private chatListCb: Callback<Chat[]> | null = null;

    private messages: Map<number, ChatMessage[]> = new Map()

    private currentChatId: number = -1

    public login(account: string, password: string, callback: Callback<AuthResponse>) {

        let m = {Account: account, Password: password}

        Ws.sendMessage<any>(ActionUserLogin, m, ((success, result, msg) => {
            callback(success, result, msg)
            if (success) {
                if (this.chatListCb != null) {
                    Ws.sendMessage(ActionUserChatList, "", this.chatListCb)
                }

                Ws.addMessageListener((msg => {
                    if (msg.Action === ActionChatMessage) {
                        this.onNewMessage(JSON.parse(msg.Data))
                    }
                }))
            }
        }))
    }

    public register(account: string, password: string, callback: Callback<boolean>) {

        let m = {Account: account, Password: password}

        Ws.sendMessage<any>(ActionUserRegister, m, callback)
    }

    public subscribeChatList(callback: Callback<Chat[]>) {
        this.chatListCb = callback
    }

    public getAllOnlineUser(callback: Callback<SearchUser[]>) {
        Ws.sendMessage<any>(ActionOnlineUser, "", callback)
    }

    public getChatList(callback: Callback<Chat[]>) {
        Ws.sendMessage(ActionUserChatList, "", callback)
    }

    public sendChatMessage(ucid: number, receiver: number, msg: string) {
        let m2: SendChatMessage = {Cid: this.currentChatId, UcId: ucid, Message: msg, MessageType: 1, Receiver: receiver}
        Ws.sendMessage(ActionChatMessage, m2, ((success, result, msg1) => {

        }))
    }

    public getChatMessage(cid: number): ChatMessage[] {
        const ret = this.messages.get(cid)
        if (typeof ret !== "undefined") {
            return ret
        } else {
            return []
        }
    }

    public setChatRoomListener(cid: number, l: (m: ChatMessage) => void) {
        this.currentChatId = cid
        this.chatListener = l
    }

    public newChat(id: number, type: number, callback: () => void) {

        Ws.sendMessage(ActionUserNewChat, {Id: id, Type: type}, ((success, result, msg) => {
            console.log(msg)
            callback()
        }))
    }

    private chatListener: (m: ChatMessage) => void = () => {
    }

    private onNewMessage(msg: ChatMessage) {
        if (this.currentChatId >= 0 && msg.ChatId === this.currentChatId) {
            this.chatListener(msg)
        }
    }
}

export let client = new Client()
