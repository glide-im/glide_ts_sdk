import {delay, map, mergeMap, Observable, of, toArray} from "rxjs";
import {onNext} from "src/rx/next";
import {Api} from "../api/api";
import {Account} from "./account";
import {CliCustomMessage, CommonMessage, Message} from "./message";
import {getSID, Session} from "./session";

export interface SessionListUpdateListener {
    (session: Session[]): void
}

export class SessionList {

    private account: Account;
    private currentSession: string = "0";

    private chatListUpdateListener: SessionListUpdateListener | null = null;
    private sessionMap: Map<string, Session> = new Map<string, Session>()

    constructor(account: Account) {
        this.account = account
    }

    public static getInstance(): SessionList {
        return Account.getInstance().getSessionList();
    }

    public init(): Observable<string> {

        return this.getSessions()
            .pipe(
                mergeMap(() => of("session init complete, " + this.sessionMap.size + " sessions")),
                // map(() => "session init complete"),
            )
    }

    public setSelectedSession(sid: string) {
        this.currentSession = sid
    }

    public getSelectedSession(): string {
        return this.currentSession
    }

    public createSession(id: string): Observable<Session> {
        if (this.getByUid(id) !== null) {
            return of(this.getByUid(id))
        }
        return Session.create(id, 1).init().pipe(onNext((r) => {
            this.add(r);
        }))
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
                    console.log("SessionList", "session list loaded: ", res)
                }),
                map(s => Session.fromSessionBean(s)),
                mergeMap(s => s.init()),
                onNext(s => {
                    console.log("SessionList", "session inited: ", s)
                    this.add(s)
                }),
                toArray(),
            )
    }

    public getSessionsTemped(): Session[] {
        return Array.from(this.sessionMap.values())
    }

    public onMessage(message: CommonMessage<Message | CliCustomMessage>) {
        const action = message.action;
        const sessionType = action.indexOf("group") !== -1 ? 2 : 1
        const target = sessionType === 2 ? message.data.to : message.data.from

        const sid = getSID(sessionType, target);
        const s = this.sessionMap.get(sid);

        if (s !== undefined) {
            s.onMessage(action, message.data as Message)
        } else {
            const ses = Session.create(target, sessionType)
            this.add(ses)
            ses.init().pipe(delay(500)).subscribe(() => {
                ses.onMessage(action, message.data as Message)
            })
        }
    }

    private add(s: Session) {
        if (this.sessionMap.has(s.ID)) {
            return
        }
        this.sessionMap.set(s.ID, s)
        console.log('SessionList', "session added: ", s, this.sessionMap.values())
        this.chatListUpdateListener?.(Array.from(this.sessionMap.values()))
    }

    public get(sid: string): Session | null {
        if (!this.sessionMap.has(sid)) {
            return null
        }
        return this.sessionMap.get(sid);
    }

    public getByUid(uid: string): Session | null {
        return this.get(getSID(1, uid))
    }

    public clear() {
        this.currentSession = ""
        this.sessionMap = new Map<string, Session>()
        this.chatListUpdateListener?.([])
    }

    public contain(chatId: string): boolean {
        return this.sessionMap.has(chatId)
    }
}
