import {ChatMessage} from "./chat_message";
import {Session} from "./session";
import {SessionBean} from "../api/model";
import {Api} from "../api/api";

export class SessionList {

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
        return Api.getRecentSession()
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
            })
    }

    public onChatMessage(message: ChatMessage) {
        if (!this.contain(message.Mid)) {

            return
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
