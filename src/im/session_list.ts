import {delay, filter, map, mergeMap, Observable, of, Subject, takeWhile, toArray} from "rxjs";
import {Api} from "../api/api";
import {Account} from "./account";
import {CliCustomMessage, CommonMessage, Message} from "./message";
import {onNext} from "../rx/next";
import {createSession, fromSessionBean, getSID, InternalSession, ISession, SessionBaseInfo} from "./session";

export enum Event {
    create = 0,
    update = 1,
    deleted = 2,
    init = 3,
}

export interface SessionEvent {
    event: Event
    session?: ISession
}

export interface SessionList {
    get(sid: string): ISession | null

    getSessions(): Observable<ISession[]>

    setSelectedSession(sid: string)

    getCurrentSession(): ISession | null

    createSession(id: string): Observable<ISession>

    event(): Observable<SessionEvent>

    getSessionsTemped(): ISession[]
}

// @Internal 仅供 glide 内部使用
export interface InternalSessionList extends SessionList {

    init(): Observable<string>

    clear()

    onMessage(message: CommonMessage<Message | CliCustomMessage>)
}

export interface SessionListCache {
    get(sid: string): Observable<SessionBaseInfo | null>

    set(sid: string, info: SessionBaseInfo): Observable<void>

    clear(): Observable<void>

    getAll(): Observable<SessionBaseInfo[]>

    remove(sid: string): Observable<void>

    contain(sid: string): Observable<boolean>

    size(): Observable<number>
}

export class InternalSessionListImpl implements InternalSessionList {

    private account: Account;
    private currentSession: string = "0";

    private sessionEventSubject = new Subject<SessionEvent>()
    private sessionMap: Map<string, InternalSession> = new Map<string, InternalSession>()

    constructor(account: Account) {
        this.account = account
    }

    public static getInstance(): SessionList {
        return Account.getInstance().getSessionList();
    }

    public init(): Observable<string> {

        return this.getSessions()
            .pipe(
                mergeMap(() => of(this.sessionEventSubject).pipe(
                    filter(s => s !== null),
                    takeWhile(s => s !== null),
                )),
                mergeMap(() => of("session init complete, " + this.sessionMap.size + " sessions")),
                // map(() => "session init complete"),
            )
    }

    public setSelectedSession(sid: string) {
        this.currentSession = sid
    }

    public getCurrentSession(): ISession | null {
        return this.get(this.currentSession)
    }

    public createSession(id: string): Observable<ISession> {
        if (this.getByUid(id) !== null) {
            return of(this.getByUid(id))
        }
        return createSession(id, 1)
            .init()
            .pipe(
                onNext((r) => {
                    this.add(r);
                }),
                map((s) => s as ISession),
            )
    }

    public event(): Observable<SessionEvent> {
        return this.sessionEventSubject
    }

    public getSessions(reload: boolean = false): Observable<ISession[]> {
        if (this.sessionMap.size !== 0 && !reload) {
            return of(Array.from(this.sessionMap.values()));
        }
        return Api.getRecentSession()
            .pipe(
                mergeMap(res => of(...res)),
                onNext(res => {
                    console.log("SessionList", "session list loaded: ", res)
                }),
                map(s => fromSessionBean(s)),
                mergeMap(s => s.init()),
                onNext(s => {
                    console.log("SessionList", "session inited: ", s)
                    this.add(s)
                }),
                toArray(),
            )
    }

    public getSessionsTemped(): ISession[] {
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
            const ses = createSession(target, sessionType)
            this.add(ses)
            ses.init().pipe(delay(500)).subscribe(() => {
                ses.onMessage(action, message.data as Message)
            })
        }
    }

    private add(s: InternalSession) {
        if (this.sessionMap.has(s.ID)) {
            return
        }
        this.sessionMap.set(s.ID, s)
        console.log('SessionList', "session added: ", s, this.sessionMap.values())
        this.sessionEventSubject.next({event: Event.create, session: s})
    }

    public get(sid: string): ISession | null {
        if (!this.sessionMap.has(sid)) {
            return null
        }
        return this.sessionMap.get(sid);
    }

    private getByUid(uid: string): ISession | null {
        return this.get(getSID(1, uid))
    }

    public clear() {
        this.currentSession = ""
        this.sessionMap = new Map<string, InternalSession>()
    }

    public contain(chatId: string): boolean {
        return this.sessionMap.has(chatId)
    }
}
