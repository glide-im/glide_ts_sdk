import {Ws} from "./ws";
import {ActionUserChatList, ActionUserNewChat, IChat} from "./message";
import {OldSession, ChatMessage} from "./oldSession";
import {client, MessageLevel} from "./client";

export class ChatList {

    private chatIdMap: Map<string, OldSession> = new Map<string, OldSession>()
    private targetIdMap: Map<string, OldSession> = new Map<string, OldSession>()
    private chats: OldSession[] = []
    private chatMessageListener: (message: ChatMessage) => void = (() => null)
    private currentChat: OldSession | null = null
    private chatUpdateListener: (chat: OldSession) => void = (() => null)
    private chatListUpdateListener: (chats: OldSession[]) => void = (() => null)

    public update(): Promise<OldSession[]> {
        console.log("ChatList/update")
        return Ws.request<IChat[]>(ActionUserChatList)
            .then(value => {
                for (let chat of value) {
                    if (this.contain(chat.Cid)) {
                        this.get(chat.Cid).update(chat)
                    } else {
                        // this.add(Session.create(chat))
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

    public startChat(id: number, type: number): Promise<OldSession> {
        console.log("ChatList/startChat", `id=${id}`, `type=${type}`)
        return Ws.request<IChat>(ActionUserNewChat, {Id: id, Type: type})
            .then(value => {
                // const chat = Session.create(value)
                // this.add(chat)
                // this.setCurrentChat(chat)
                // return chat
                return null
            })
            .finally(() => {
                console.log('ChatList/startChat', 'completed')
            })
    }

    public setChatListUpdateListener(l: (chats: OldSession[]) => void) {
        this.chatListUpdateListener = l
    }

    public onChatMessage(message: ChatMessage) {
        if (!this.contain(message.Cid)) {
            const chat = new OldSession()
            chat.ID = message.Cid
            chat.init()
                .then(() => {
                    this.add(chat)
                    this.onChatMessage(message)
                })
            return
        }
        console.log('ChatList/onChatMessage')
        const chat = this.get(message.Cid)
        this.get(message.Cid).onNewMessage(message)
        if (this.currentChat != null && this.currentChat.ID === message.Cid) {
            this.chatMessageListener(message)
            this.onChatUpdate(chat)
        }
        this.chatListUpdateListener(this.chats)
        if (message.Sender !== client.uid) {
            client.showMessage(MessageLevel.LevelInfo, `New Message: ${message.getMessageExtra()}`)
        }
    }

    public getCurrentChat(): OldSession | null {
        return this.currentChat
    }

    public getAllChat(): OldSession[] {
        return this.chats
    }

    public setCurrentChat(chat: OldSession | null,
                          updateListener?: (chat: OldSession) => void,
                          chatMsgListener?: (message: ChatMessage) => void) {
        this.currentChat = chat
        if (updateListener) {
            this.chatUpdateListener = updateListener
        }
        if (chatMsgListener) {
            this.chatMessageListener = chatMsgListener
        }
    }

    public getChatByTarget(id: number, type: number = 1): OldSession | null {
        const key = `${type}-${id}`
        if (this.targetIdMap.has(key)) {
            return this.targetIdMap.get(key)
        }
        return null
    }

    public newChat(chatId: string): OldSession {
        const chat = new OldSession()
        chat.ID = chatId
        chat.init().then((c) => {
            this.onChatUpdate(c)
        })
        this.add(chat)
        return chat
    }

    public addAll(chat: OldSession[]) {
        chat.forEach(value => this.add(value))
    }

    public add(chat: OldSession) {
        if (this.chatIdMap.has(chat.ID)) {
            return
        }
        this.chats.push(chat)
        this.targetIdMap.set(`${chat.ChatType}-${chat.Target}`, chat)
        this.chatIdMap.set(chat.ID, chat)
        this.onChatUpdate(chat)
    }

    public get(chatId: string): OldSession | null {
        if (this.contain(chatId)) {
            return this.chatIdMap.get(chatId)
        } else {
            return null
        }
    }

    public clear() {
        this.currentChat = null
        this.chats = []
        this.chatIdMap = new Map<string, OldSession>()
        this.targetIdMap = new Map<string, OldSession>()
        this.chatListUpdateListener([])
    }

    public contain(chatId: string): boolean {
        return this.chatIdMap.has(chatId)
    }

    private onChatUpdate(chat: OldSession) {
        if ((this.currentChat?.ID ?? -1) === chat.ID) {
            this.chatUpdateListener(chat)
        }
        // this.get(chat.ID)?.update(chat)
    }
}
