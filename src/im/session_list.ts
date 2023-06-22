import {catchError, concat, filter, groupBy, map, mergeMap, Observable, of, Subject, tap, toArray,} from 'rxjs';
import {Api} from '../api/api';
import {Account} from './account';
import {Actions, CliCustomMessage, CommonMessage, Message} from './message';
import {
    createSession,
    fromBaseInfo,
    fromSessionBean,
    getSID,
    InternalSession,
    Session,
    SessionBaseInfo,
    SessionId,
    SessionType,
} from './session';
import {ChatMessageCache} from './chat_message';
import {Logger} from '../utils/Logger';

export enum SessionListEventType {
    create = 0,
    update = 1,
    deleted = 2,
    init = 3,
}

export interface SessionListEvent {
    event: SessionListEventType;
    session?: Session;
}

export interface SessionList {
    get(sid: SessionId): Session | null;

    getSessions(): Observable<Session[]>;

    setSelectedSession(sid: SessionId);

    getCurrentSession(): Session | null;

    createSession(id: SessionId): Observable<Session>;

    event(): Observable<SessionListEvent>;

    getSessionsTemped(): Session[];

    cleanCache(): Observable<any>;
}

// @Internal 仅供 glide 内部使用
export interface InternalSessionList extends SessionList {
    init(cache: SessionListCache & ChatMessageCache): Observable<string>;

    clear();

    onMessage(message: CommonMessage<Message | CliCustomMessage>);
}

export interface SessionListCache {
    getSession(sid: SessionId): Observable<SessionBaseInfo | null>;

    setSession(info: SessionBaseInfo): Observable<void>;

    clearAllSession(): Observable<void>;

    getAllSession(): Observable<SessionBaseInfo[]>;

    removeSession(sid: SessionId): Observable<void>;

    containSession(sid: SessionId): Observable<boolean>;

    sessionCount(): Observable<number>;
}

export class InternalSessionListImpl implements InternalSessionList {
    private tag = 'InternalSessionListImpl';

    private account: Account;
    private currentSession: string = '0';

    private sessionEventSubject = new Subject<SessionListEvent>();
    private sessionMap: Map<SessionId, InternalSession> = new Map<SessionId,
        InternalSession>();

    private readonly cache: SessionListCache & ChatMessageCache;

    constructor(account: Account, cache: SessionListCache & ChatMessageCache) {
        this.account = account;
        this.cache = cache;
    }

    public static getInstance(): SessionList {
        return Account.getInstance().getSessionList();
    }

    public init(
        cache: SessionListCache & ChatMessageCache
    ): Observable<string> {
        return concat(
            of('start load session from cache'),
            this.cache.getAllSession().pipe(
                mergeMap((res) => of(...res)),
                mergeMap((bi) => this.add(fromBaseInfo(bi, this.cache), false)),
                mergeMap((session) => {
                    Logger.log(
                        this.tag,
                        'load session from cache, ' + session.ID
                    );
                    return session.init();
                }),
                catchError((err) => {
                    Logger.error('load session from cache failed, ' + err);
                    return of(null);
                }),
                filter((v) => v !== null),
                toArray(),
                map(
                    (s) =>
                        'load session from cache complete, ' +
                        s.length +
                        ' session'
                ),
                catchError((err) =>
                    of('load session from cache failed, ' + err)
                )
            ),
            of('start sync session from server'),
            this.getSessions(false).pipe(
                map(() => 'session sync complete'),
                catchError((err) => `session sync failed, ${err}`)
            )
        );
    }

    public setSelectedSession(sid: SessionId) {
        this.currentSession = sid;
    }

    public getCurrentSession(): InternalSession | null {
        return this.get(this.currentSession);
    }

    public createSession(id: SessionId): Observable<InternalSession> {
        if (this.getByUid(id) !== null) {
            return of(this.getByUid(id));
        }
        const newSession = createSession(id, SessionType.Single, this.cache);
        return this.add(newSession, true).pipe(
            tap((r) => {
                // 不等待初始化完成
                r.init().subscribe();
            })
        );
    }

    public event(): Observable<SessionListEvent> {
        return this.sessionEventSubject;
    }

    public getSessions(reload: boolean = false): Observable<InternalSession[]> {
        if (this.sessionMap.size !== 0 && !reload) {
            return of(Array.from(this.sessionMap.values()));
        }
        return Api.getRecentSession().pipe(
            mergeMap((beans) => of(...beans)),
            groupBy((bean) =>
                this.contain(getSID(bean.Type, bean.To.toString()))
            ),
            mergeMap((group) => {
                if (group.key) {
                    // session exists, update from bean
                    return group.pipe(
                        mergeMap((ss) => of(ss)),
                        map((ss) => {
                            const sid = getSID(ss.Type, ss.To.toString());
                            let session = this.sessionMap.get(sid);
                            session.update(ss);
                            return session;
                        })
                    );
                }

                // session not exists, create new session
                return group.pipe(
                    mergeMap((ss) => of(ss)),
                    mergeMap((ss) => {
                        const session = fromSessionBean(ss, this.cache);
                        return this.add(session, true).pipe(
                            mergeMap(() => session.init())
                        );
                    })
                );
            }),
            toArray()
        );
    }

    public getSessionsTemped(): InternalSession[] {
        return Array.from(this.sessionMap.values());
    }

    public onMessage(message: CommonMessage<Message | CliCustomMessage>) {
        let sessionType: SessionType = SessionType.Single;
        let target = message.data.from;

        switch (message.action) {
            case Actions.MessageChat:
            case Actions.MessageChatRecall:
                sessionType = SessionType.Single;
                target = message.data.from;
                break;
            case Actions.MessageGroupRecall:
            case Actions.MessageGroup:
            case Actions.NotifyGroup:
                sessionType = SessionType.Channel;
                target = message.data.to;
                break;
        }

        const session = this.get(getSID(sessionType, target));

        if (session !== null) {
            session.onMessage(message.action, message.data as Message);
        } else {
            of(createSession(target, sessionType, this.cache))
                .pipe(
                    mergeMap((ses) => this.add(ses, true)),
                    mergeMap((ses) => ses.init())
                )
                .subscribe({
                    next: (r) =>
                        r.onMessage(message.action, message.data as Message),
                    error: (err) => Logger.error(this.tag, 'onMessage', err),
                });
        }
    }

    private add(
        session: InternalSession,
        updateDb: Boolean
    ): Observable<InternalSession> {
        if (this.sessionMap.has(session.ID)) {
            return of(this.sessionMap.get(session.ID));
        }

        // 是否需要更新缓存成功后再添加到内存 ?
        this.sessionMap.set(session.ID, session);
        Logger.log(
            this.tag,
            'session added, update cache=',
            updateDb,
            session.ID
        );
        this.sessionEventSubject.next({
            event: SessionListEventType.create,
            session: session,
        });
        if (!updateDb) {
            return of(session);
        }
        return this.cache.setSession(session as SessionBaseInfo).pipe(
            tap(() =>
                Logger.log(this.tag, 'session added to cache: ', session.ID)
            ),
            map(() => session),
            catchError((err) => {
                Logger.error(
                    this.tag,
                    'session added to cache failed: ',
                    session.ID,
                    err
                );
                return of(session);
            })
        );
    }

    public cleanCache(): Observable<any> {
        return new Observable<InternalSession>((observer) => {
            this.sessionMap.forEach((session) => {
                observer.next(session)
            })
            observer.complete();
        }).pipe(
            mergeMap<InternalSession, any>((session) => this.remove(session)),
            toArray(),
            tap(() => {
                this.currentSession = "";
                this.sessionMap.clear();
            })
        )
    }

    public remove(session: InternalSession): Observable<any> {
        return session.clearMessageHistory().pipe(
            mergeMap(() => this.cache.removeSession(session.ID)),
            tap(() => {
                this.sessionEventSubject.next({
                    event: SessionListEventType.deleted,
                    session: this.sessionMap.get(session.ID),
                })
                this.sessionMap.delete(session.ID);
                Logger.log(this.tag, 'session removed from cache: ', session.ID);
            })
        )
    }

    public get(sid: SessionId): InternalSession | null {
        if (!this.sessionMap.has(sid)) {
            return null;
        }
        return this.sessionMap.get(sid);
    }

    private getByUid(uid: SessionId): InternalSession | null {
        return this.get(getSID(1, uid));
    }

    public clear() {
        this.currentSession = '';
        this.sessionMap = new Map<SessionId, InternalSession>();
    }

    public contain(chatId: SessionId): boolean {
        return this.sessionMap.has(chatId);
    }
}
