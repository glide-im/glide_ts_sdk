import {Ws} from "./ws";
import {ActionUserChatList, ActionUserNewChat, IChat} from "./message";
import {Chat, ChatMessage} from "./Chat";

export class ChatList {

    private chatMap: Map<number, Chat> = new Map<number, Chat>()
    private chats: Chat[] = []
    private chatMessageListener: (message: ChatMessage) => void = (() => null)
    private currentChat: Chat | null = null
    private chatUpdateListener: (chat: Chat) => void = (() => null)
    private chatListUpdateListener: (chats: Chat[]) => void = ((c) => null)

    public update() {
        Ws.sendMessage<IChat[]>(ActionUserChatList, "", ((success, result, msg) => {
            if (!success) {
                console.log("get chat list error", msg)
            }
            console.log("ChatList/update", "update")
            for (let chat of result) {
                if (this.contain(chat.Cid)) {
                    this.get(chat.Cid).update(chat)
                } else {
                    const c = Chat.create(chat)
                    c.init(() => null)
                    this.add(c)
                }
            }

            if (this.currentChat == null && this.chats.length > 0) {
                this.currentChat = this.chats[0]
            }
            this.chatListUpdateListener(this.chats)
        }))
    }

    public startChat(id: number, type: number, callback: () => void) {

        Ws.sendMessage<IChat>(ActionUserNewChat, {Id: id, Type: type}, ((success, result, msg) => {
            console.log(msg)
            callback()
        }))
    }

    public setChatListUpdateListener(l: (chats: Chat[]) => void) {
        this.chatListUpdateListener = l
    }

    public onChatMessage(message: ChatMessage) {
        if (!this.contain(message.Cid)) {
            const chat = new Chat()
            chat.Cid = message.Cid
            chat.init(() => {
            })
            this.add(chat)
        }
        this.get(message.Cid).onNewMessage(message)
        if (this.currentChat.Cid === message.Cid) {
            this.chatMessageListener(message)
            this.onChatUpdate(this.get(message.Cid))
        }
        this.chatListUpdateListener(this.chats)
    }

    public getCurrentChat(): Chat | null {
        return this.currentChat
    }

    public getAllChat(): Chat[] {
        return this.chats
    }

    public setCurrentChat(chat: Chat | null,
                          updateListener: (chat: Chat) => void,
                          chatMsgListener: (message: ChatMessage) => void) {
        this.currentChat = chat
        this.chatUpdateListener = updateListener
        this.chatMessageListener = chatMsgListener
    }

    public newChat(chatId: number): Chat {
        const chat = new Chat()
        chat.Cid = chatId
        chat.init(this.onChatUpdate)
        this.add(chat)
        return chat
    }

    public addAll(chat: Chat[]) {
        chat.forEach(value => this.add(value))
    }

    public add(chat: Chat) {
        if (this.chatMap.has(chat.Cid)) {
            return
        }
        this.chats.push(chat)
        this.chatMap.set(chat.Cid, chat)
    }

    public get(chatId: number): Chat | null {
        if (this.contain(chatId)) {
            return this.chatMap.get(chatId)
        } else {
            return null
        }
    }

    public contain(chatId: number): boolean {
        return this.chatMap.has(chatId)
    }

    private onChatUpdate(chat: Chat) {
        if (this.currentChat.Cid === chat.Cid) {
            this.chatUpdateListener(chat)
        }
        this.get(chat.Cid).update(chat)
    }
}
