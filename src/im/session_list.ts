import {catchError, concat, filter, groupBy, map, mergeMap, Observable, of, Subject, toArray} from "rxjs";
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
    SessionBaseInfo,
    SessionId,
    SessionType
} from "./session";
import {ChatMessageCache} from "./chat_message";
import {Logger} from "../utils/Logger";


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
    get(sid: SessionId): ISession | null

    getSessions(): Observable<ISession[]>

    setSelectedSession(sid: SessionId)

    getCurrentSession(): ISession | null

    createSession(id: SessionId): Observable<ISession>

    event(): Observable<SessionEvent>

    getSessionsTemped(): ISession[]
}

// @Internal 仅供 glide 内部使用
export interface InternalSessionList extends SessionList {

    init(cache: SessionListCache & ChatMessageCache): Observable<string>

    clear()

    onMessage(message: CommonMessage<Message | CliCustomMessage>)
}

export interface SessionListCache {
    getSession(sid: SessionId): Observable<SessionBaseInfo | null>

    setSession(sid: SessionId, info: SessionBaseInfo): Observable<void>

    clearAllSession(): Observable<void>

    getAllSession(): Observable<SessionBaseInfo[]>

    removeSession(sid: SessionId): Observable<void>

    containSession(sid: SessionId): Observable<boolean>

    sessionCount(): Observable<number>
}

export class InternalSessionListImpl implements InternalSessionList {

    private account: Account;
    private currentSession: string = "0";

    private sessionEventSubject = new Subject<SessionEvent>()
    private sessionMap: Map<SessionId, InternalSession> = new Map<SessionId, InternalSession>()

    private cache: SessionListCache & ChatMessageCache;

    constructor(account: Account) {
        this.account = account
    }

    public static getInstance(): SessionList {
        return Account.getInstance().getSessionList();
    }

    public init(cache: SessionListCache & ChatMessageCache): Observable<string> {
        this.cache = cache

        return concat(
            of("start load session from cache"),
            this.cache.getAllSession().pipe(
                mergeMap((res) => of(...res)),
                map((v) =>
                    this.add(fromBaseInfo(v), false).pipe(
                        onNext((res) => {
                            res.init(this.cache).subscribe()
                        }),
                        catchError(err => {
                            Logger.error("load session from cache failed, " + err)
                            return of(null)
                        })
                    )
                ),
                filter((v) => v !== null),
                toArray(),
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

    public setSelectedSession(sid: SessionId) {
        this.currentSession = sid
    }

    public getCurrentSession(): InternalSession | null {
        return this.get(this.currentSession)
    }

    public createSession(id: SessionId): Observable<InternalSession> {
        if (this.getByUid(id) !== null) {
            return of(this.getByUid(id))
        }
        const newSession = createSession(id, SessionType.Single)

        return this.add(newSession, true).pipe(
            onNext((r) => {
                // 不等待初始化完成
                r.init(this.cache).subscribe()
            })
        )
    }

    public event(): Observable<SessionEvent> {
        return this.sessionEventSubject
    }

    public getSessions(reload: boolean = false): Observable<InternalSession[]> {
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
                                mergeMap(() => session.init(this.cache)),
                            )
                        }),
                    )
                }),
                toArray(),
            )
    }

    public getSessionsTemped(): InternalSession[] {
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
            this.add(ses, true).pipe(
                onNext((r => {
                        r.onMessage(action, message.data as Message)
                        r.init(this.cache).subscribe()
                    })
                ),
            ).subscribe({
                error: err => Logger.error("SessionList.onMessage", err)
            })
        }
    }

    private add(s: InternalSession, updateDb: Boolean): Observable<InternalSession> {
        if (this.sessionMap.has(s.ID)) {
            return of(this.sessionMap.get(s.ID))
        }
        if (!updateDb) {
            this.sessionMap.set(s.ID, s)
            Logger.log('SessionList', "session added: ", s.ID)
            this.sessionEventSubject.next({event: Event.create, session: s})
            return of(s)
        }
        return this.cache.setSession(s.ID, s as SessionBaseInfo).pipe(
            onNext(() => {
                    this.sessionMap.set(s.ID, s)
                    Logger.log('SessionList', "session added: ", s.ID)
                    this.sessionEventSubject.next({event: Event.create, session: s})
                }
            ),
            map(() => s)
        );
    }

    public get(sid: SessionId): InternalSession | null {
        if (!this.sessionMap.has(sid)) {
            return null
        }
        return this.sessionMap.get(sid);
    }

    private getByUid(uid: SessionId): InternalSession | null {
        return this.get(getSID(1, uid))
    }

    public clear() {
        this.currentSession = ""
        this.sessionMap = new Map<SessionId, InternalSession>()
    }

    public contain(chatId: SessionId): boolean {
        return this.sessionMap.has(chatId)
    }
}
