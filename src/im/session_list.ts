import { map, mergeMap, Observable, of, toArray } from "rxjs";
import { onNext } from "src/rx/next";
import { Api } from "../api/api";
import { Account } from "./account";
import { Message } from "./message";
import { Session } from "./session";

export interface SessionListUpdateListener {
    (session: Session[]): void
}

export class SessionList {

    private account: Account;
    public currentSid: string = "0";

    private chatListUpdateListener: SessionListUpdateListener | null = null;
    private sessionMap: Map<number, Session> = new Map<number, Session>()

    constructor(account: Account) {
        this.account = account
    }

    public init() {

    }

    public startChat(id: number): Promise<Session> {
        return Promise.reject("not implemented")
    }

    public setChatListUpdateListener(l: SessionListUpdateListener | null) {
        this.chatListUpdateListener = l
    }

    public getSessions(reload: boolean = false): Observable<Session[]> {
        if (this.sessionMap.size !== 0 && !reload) {
            return of(Array.from(this.sessionMap.values()));
        }
        return Api.getRecentSession()
            .pipe(
                mergeMap(res => of(...res)),
                map(s => Session.fromSessionBean(s)),
                onNext(s => this.add(s)),
                toArray(),
            )
    }

    public getSessionsTemped(): Session[] {
        return Array.from(this.sessionMap.values())
    }

    public onMessage(message: Message) {
        const uid = this.account.getUID()
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

    private add(s: Session) {
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
