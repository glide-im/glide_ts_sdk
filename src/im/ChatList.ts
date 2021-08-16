import {Ws} from "./ws";
import {ActionUserChatList, ActionUserNewChat, IChat} from "./message";
import {Chat, ChatMessage} from "./chat";
import {client, MessageLevel} from "./client";

export class ChatList {

    private chatIdMap: Map<number, Chat> = new Map<number, Chat>()
    private targetIdMap: Map<string, Chat> = new Map<string, Chat>()
    private chats: Chat[] = []
    private chatMessageListener: (message: ChatMessage) => void = (() => null)
    private currentChat: Chat | null = null
    private chatUpdateListener: (chat: Chat) => void = (() => null)
    private chatListUpdateListener: (chats: Chat[]) => void = (() => null)

    public update(): Promise<Chat[]> {
        console.log("ChatList/update")
        return Ws.request<IChat[]>(ActionUserChatList)
            .then(value => {
                for (let chat of value) {
                    if (this.contain(chat.Cid)) {
                        this.get(chat.Cid).update(chat)
                    } else {
                        this.add(Chat.create(chat))
                    }
                }
                return Promise.resolve(this.chats)
            })
            .then(value => {
                const chatUpdate = value.map((c) => c.init())
                return Promise.allSettled(chatUpdate)
            })
            .then(() => {
                if (this.currentChat == null && this.chats.length > 0) {
                    this.currentChat = this.chats[0]
                }
                this.chatListUpdateListener(this.chats)
            })
            .then(() => {
                return Promise.resolve(this.chats)
            })
            .finally(() => {
                console.log('ChatList/update', 'completed')
            })
    }

    public startChat(id: number, type: number): Promise<Chat> {
        console.log("ChatList/startChat", `id=${id}`, `type=${type}`)
        return Ws.request<IChat>(ActionUserNewChat, {Id: id, Type: type})
            .then(value => {
                const chat = Chat.create(value)
                this.add(chat)
                this.setCurrentChat(chat)
                return chat
            })
            .finally(() => {
                console.log('ChatList/startChat', 'completed')
            })
    }

    public setChatListUpdateListener(l: (chats: Chat[]) => void) {
        this.chatListUpdateListener = l
    }

    public onChatMessage(message: ChatMessage) {
        console.log('ChatList/onChatMessage')
        if (!this.contain(message.Cid)) {
            const chat = new Chat()
            chat.Cid = message.Cid
            chat.init()
                .then(() => {
                    this.add(chat)
                    this.onChatMessage(message)
                })
            return
        }
        const chat = this.get(message.Cid)
        this.get(message.Cid).onNewMessage(message)
        if (this.currentChat != null && this.currentChat.Cid === message.Cid) {
            this.chatMessageListener(message)
            this.onChatUpdate(chat)
        }
        this.chatListUpdateListener(this.chats)
        if (message.Sender !== client.uid) {
            client.showMessage(MessageLevel.LevelInfo, `New Message: ${message.getMessageExtra()}`)
        }
    }

    public getCurrentChat(): Chat | null {
        return this.currentChat
    }

    public getAllChat(): Chat[] {
        return this.chats
    }

    public setCurrentChat(chat: Chat | null,
                          updateListener?: (chat: Chat) => void,
                          chatMsgListener?: (message: ChatMessage) => void) {
        this.currentChat = chat
        if (updateListener) {
            this.chatUpdateListener = updateListener
        }
        if (chatMsgListener) {
            this.chatMessageListener = chatMsgListener
        }
    }

    public getChatByTarget(id: number, type: number = 1): Chat | null {
        const key = `${type}-${id}`
        if (this.targetIdMap.has(key)) {
            return this.targetIdMap.get(key)
        }
        return null
    }

    public newChat(chatId: number): Chat {
        const chat = new Chat()
        chat.Cid = chatId
        chat.init().then((c) => {
            this.onChatUpdate(c)
        })
        this.add(chat)
        return chat
    }

    public addAll(chat: Chat[]) {
        chat.forEach(value => this.add(value))
    }

    public add(chat: Chat) {
        if (this.chatIdMap.has(chat.Cid)) {
            return
        }
        this.chats.push(chat)
        this.targetIdMap.set(`${chat.ChatType}-${chat.Target}`, chat)
        this.chatIdMap.set(chat.Cid, chat)
        this.onChatUpdate(chat)
    }

    public get(chatId: number): Chat | null {
        if (this.contain(chatId)) {
            return this.chatIdMap.get(chatId)
        } else {
            return null
        }
    }

    public clear() {
        this.currentChat = null
        this.chats = []
        this.chatIdMap = new Map<number, Chat>()
        this.targetIdMap = new Map<string, Chat>()
        this.chatListUpdateListener([])
    }

    public contain(chatId: number): boolean {
        return this.chatIdMap.has(chatId)
    }

    private onChatUpdate(chat: Chat) {
        if ((this.currentChat?.Cid ?? -1) === chat.Cid) {
            this.chatUpdateListener(chat)
        }
        this.get(chat.Cid)?.update(chat)
    }
}
