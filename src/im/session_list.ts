
import { Session } from "./session";
import { SessionBean } from "../api/model";
import { Api } from "../api/api";
import { Message } from "./message";
import { Account } from "./account";

export class SessionList {

    public currentSid: string;

    private sessionMap: Map<number, Session> = new Map<number, Session>()

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
        this.sessionMap = new Map<number, Session>()
        return Api.getRecentSession()
            .then(s => {
                const res = s.map(item => Session.fromSessionBean(item))

                // mock
                const sessionBean: SessionBean = {
                    CreateAt: 0, LastMid: 1, Uid1: 2, Uid2: 3, Unread: 0, UpdateAt: 0, To: 1
                }
                res.push(Session.fromSessionBean(sessionBean))

                // temp
                res.forEach(item => {
                    this.add(item)
                })
                return res
            })
    }

    public onMessage(message: Message) {
        const uid = Account.getInstance().getUID()
        let s = message.from
        if (message.from === uid) {
            s = message.to
        }
        console.log("list.onMessage1", message, s)
        if (this.sessionMap.has(s)) {
            const session = this.get(s)
            session.onMessage(message)
        }
    }

    public add(s: Session) {
        if (this.sessionMap.has(s.To)) {
            return
        }
        this.sessionMap.set(s.To, s)
    }

    public get(sid: number): Session | null {
        return this.sessionMap.get(sid);
    }

    public clear() {
        this.currentSid = ""
        this.sessionMap = new Map<number, Session>()
        this.chatListUpdateListener([])
    }

    public contain(chatId: number): boolean {
        return this.sessionMap.has(chatId)
    }
}
