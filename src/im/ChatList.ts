import {ChatMessage} from "./oldSession";
import {client, MessageLevel} from "./client";
import {Session} from "./session";
import {getRecentSession} from "../api/api";
import {SessionBean} from "../api/model";

export class ChatList {

    public currentSid: string;

    private sessionMap: Map<string, Session> = new Map<string, Session>()

    private chatListUpdateListener: (chats: Session[]) => void = (() => null)

    public startChat(id: number, type: number): Promise<Session> {
        return Promise.reject("not implemented")
    }

    public setChatListUpdateListener(l: (chats: Session[]) => void) {

    }

    public getSessions(reload: boolean = false): Promise<Session[]> {
        if (this.sessionMap.size !== 0 && !reload) {
            return Promise.resolve(Array.from(this.sessionMap.values()))
        }
        this.sessionMap = new Map<string, Session>()
        return getRecentSession()
            .then(s => {
                const res = s.map(item => Session.fromSessionBean(item))

                // mock
                const sessionBean: SessionBean = {
                    CreateAt: 0, LastMid: 1, Uid1: 2, Uid2: 3, Unread: 0, UpdateAt: 0
                }
                res.push(Session.fromSessionBean(sessionBean))

                // temp
                res.forEach(item => {
                    this.add(item)
                })
                return res
            }).catch(err => {
                return err.toString()
            })
    }

    public onChatMessage(message: ChatMessage) {
        if (!this.contain(message.Cid)) {

            return
        }

        if (message.Sender !== client.uid) {
            client.showMessage(MessageLevel.LevelInfo, `New Message: ${message.getMessageExtra()}`)
        }
    }

    public add(chat: Session) {
        if (this.sessionMap.has(chat.ID)) {
            return
        }
        this.sessionMap.set(chat.ID, chat)
    }

    public get(sid: string): Session | null {
        return this.sessionMap.get(sid);
    }

    public clear() {
        this.currentSid = ""
        this.sessionMap = new Map<string, Session>()
        this.chatListUpdateListener([])
    }

    public contain(chatId: string): boolean {
        return this.sessionMap.has(chatId)
    }
}

export const IMChatList = new ChatList()
