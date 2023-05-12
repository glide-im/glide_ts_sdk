import {catchError, concat, groupBy, map, mergeMap, Observable, of, Subject, toArray} from "rxjs";
import {Api} from "../api/api";
import {Account} from "./account";
import {CliCustomMessage, CommonMessage, Message} from "./message";
import {onNext} from "../rx/next";
import {
    createSession,
    fromBaseInfo,
    fromSessionBean,
    getSID,
    InternalSession,
    ISession,
    SessionBaseInfo
} from "./session";

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

    init(cache: SessionListCache): Observable<string>

    clear()

    onMessage(message: CommonMessage<Message | CliCustomMessage>)
}

export interface SessionListCache {
    getSession(sid: string): Observable<SessionBaseInfo | null>

    setSession(sid: string, info: SessionBaseInfo): Observable<void>

    clearAllSession(): Observable<void>

    getAllSession(): Observable<SessionBaseInfo[]>

    removeSession(sid: string): Observable<void>

    containSession(sid: string): Observable<boolean>

    sessionCount(): Observable<number>
}

export class InternalSessionListImpl implements InternalSessionList {

    private account: Account;
    private currentSession: string = "0";

    private sessionEventSubject = new Subject<SessionEvent>()
    private sessionMap: Map<string, InternalSession> = new Map<string, InternalSession>()

    private cache: SessionListCache;

    constructor(account: Account) {
        this.account = account
    }

    public static getInstance(): SessionList {
        return Account.getInstance().getSessionList();
    }

    public init(cache: SessionListCache): Observable<string> {
        this.cache = cache

        return concat(
            of("start load session from cache"),
            this.cache.getAllSession().pipe(
                onNext((res) => {
                    res.forEach((v) => this.add(fromBaseInfo(v), false))
                }),
                map((s) => "load session from cache complete, " + s.length + " session"),
                catchError(err => of("load session from cache failed, " + err))
            ),
            of("start sync session from server"),
            this.getSessions(true).pipe(
                map(() => "session sync complete"),
                catchError(err => `session sync failed, ${err}`)
            )
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
                mergeMap((s) => this.add(s, true))
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
                mergeMap(beans => of(...beans)),
                groupBy(bean => this.contain(getSID(bean.Type, bean.To.toString()))),
                mergeMap(group => {
                    if (group.key) {
                        // session exists, update from bean
                        return group.pipe(
                            mergeMap(ss => of(ss)),
                            map(ss => {
                                const sid = getSID(ss.Type, ss.To.toString())
                                let session = this.sessionMap.get(sid)
                                session.update(ss)
                                return session
                            }),
                        )
                    }

                    // session not exists, create new session
                    return group.pipe(
                        mergeMap(ss => of(ss)),
                        mergeMap(ss => {
                            const session = fromSessionBean(ss)
                            return this.add(session, true).pipe(
                                mergeMap(() => session.init()),
                            )
                        }),
                    )
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

        const s = this.get(getSID(sessionType, target))

        if (s !== null) {
            s.onMessage(action, message.data as Message)
        } else {
            const ses = createSession(target, sessionType)
            ses.init().pipe(
                mergeMap(() => this.add(ses, true)),
            ).subscribe(() => {
                ses.onMessage(action, message.data as Message)
            })
        }
    }

    private add(s: InternalSession, updateDb: Boolean): Observable<any> {
        if (this.sessionMap.has(s.ID)) {
            return of(this.sessionMap.get(s.ID))
        }
        if (!updateDb) {
            this.sessionMap.set(s.ID, s)
            console.log('SessionList', "session added: ", s.ID)
            this.sessionEventSubject.next({event: Event.create, session: s})
            return of(null)
        }
        return this.cache.setSession(s.ID, s).pipe(
            onNext(() => {
                    this.sessionMap.set(s.ID, s)
                    console.log('SessionList', "session added: ", s, this.sessionMap.values())
                    this.sessionEventSubject.next({event: Event.create, session: s})
                }
            )
        );
    }

    public get(sid: string): InternalSession | null {
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
