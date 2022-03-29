import {Ws} from "./ws";
import {ActionUserNewChat, IChat} from "./message";
import {ChatMessage, OldSession} from "./oldSession";
import {client, MessageLevel} from "./client";
import {Session} from "./session";
import {getRecentSession} from "../api/api";
import {SessionBean} from "../api/model";

export class ChatList {

    private chatIdMap: Map<string, OldSession> = new Map<string, OldSession>()
    private targetIdMap: Map<string, OldSession> = new Map<string, OldSession>()
    private chats: OldSession[] = []
    private chatMessageListener: (message: ChatMessage) => void = (() => null)
    private currentChat: OldSession | null = null
    private chatUpdateListener: (chat: OldSession) => void = (() => null)
    private chatListUpdateListener: (chats: OldSession[]) => void = (() => null)

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

    public setChatListUpdateListener(l: (chats: Session[]) => void) {

    }

    public getSessions(): Promise<Session[]> {
        return getRecentSession()
            .then(s => {
                const res = s.map(item => Session.fromSessionBean(item))
                const sessionBean: SessionBean = {
                    CreateAt: 0, LastMid: 1, Uid1: 2, Uid2: 3, Unread: 0, UpdateAt: 0
                }
                res.push(Session.fromSessionBean(sessionBean))
                return res
            }).catch(err => {
                return err.toString()
            })
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

        if (this.currentChat != null && this.currentChat.ID === message.Cid) {
            this.chatMessageListener(message)


        }
        this.chatListUpdateListener(this.chats)
        if (message.Sender !== client.uid) {
            client.showMessage(MessageLevel.LevelInfo, `New Message: ${message.getMessageExtra()}`)
        }
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

    public get(sid: string): Session | null {
        const session = new Session();
        session.ID = sid
        session.Title = sid
        return session;
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
