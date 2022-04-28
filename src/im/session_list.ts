import { map, mergeMap, Observable, of, toArray } from "rxjs";
import { onNext } from "src/rx/next";
import { Api } from "../api/api";
import { Account } from "./account";
import { Actions, Message } from "./message";
import { Session } from "./session";

export interface SessionListUpdateListener {
    (session: Session[]): void
}

export class SessionList {

    private account: Account;
    public currentChatTo: string = "0";

    private chatListUpdateListener: SessionListUpdateListener | null = null;
    private sessionMap: Map<number, Session> = new Map<number, Session>()

    constructor(account: Account) {
        this.account = account
    }

    public init(): Observable<string> {

        return this.getSessions()
            .pipe(
                mergeMap(() => of("session init complete, " + this.sessionMap.size + " sessions")),
                // map(() => "session init complete"),
            )
    }

    public startChat(id: number): Promise<Session> {
        return Promise.reject("not implemented")
    }

    public setChatListUpdateListener(l: SessionListUpdateListener | null) {
        this.chatListUpdateListener = l
    }

    public update(): Observable<Session[]> {
        return this.getSessions(true)
    }

    public getSessions(reload: boolean = false): Observable<Session[]> {
        if (this.sessionMap.size !== 0 && !reload) {
            return of(Array.from(this.sessionMap.values()));
        }
        return Api.getRecentSession()
            .pipe(
                mergeMap(res => of(...res)),
                onNext(res => {
                    console.log("session list loaded: ", res)
                }),
                map(s => Session.fromSessionBean(s)),
                mergeMap(s => s.init()),
                onNext(s => {
                    console.log("session inited: ", s)
                    this.add(s)
                }),
                toArray(),
            )
    }

    public getSessionsTemped(): Session[] {
        return Array.from(this.sessionMap.values())
    }

    public onMessage(action: Actions, message: Message) {
        const uid = this.account.getUID()
        let s = message.from
        if (message.from === uid) {
            s = message.to
        }
        if (this.sessionMap.has(s)) {
            const session = this.get(s)
            session.onMessage(message)
        } else {
            const sessionType = action.startsWith("group") ? 2 : 1
            const ses = Session.create(message.from, sessionType)
            ses.onMessage(message)
            this.add(ses)
        }
    }

    private add(s: Session) {
        if (this.sessionMap.has(s.To)) {
            return
        }
        this.sessionMap.set(s.To, s)
        this.chatListUpdateListener?.(Array.from(this.sessionMap.values()))
    }

    public get(sid: number): Session | null {
        return this.sessionMap.get(sid);
    }

    public clear() {
        this.currentChatTo = ""
        this.sessionMap = new Map<number, Session>()
        this.chatListUpdateListener?.([])
    }

    public contain(chatId: number): boolean {
        return this.sessionMap.has(chatId)
    }
}
