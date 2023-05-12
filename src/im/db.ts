import {SessionListCache} from "./session_list";
import {SessionBaseInfo} from "./session";
import {DBSchema, IDBPDatabase, openDB} from "idb";
import {catchError, concat, map, mergeMap, Observable, of, retry} from "rxjs";
import {fromPromise} from "rxjs/internal/observable/innerFrom";
import {ChatMessageCache, MessageBaseInfo} from "./chat_message";
import {MessageStatus} from "./message";

export class Db {

}

interface GlideDBSchema extends DBSchema {
    session: {
        value: SessionBaseInfo,
        key: string,
        indexes: { 'by-to': string }
    },
    message: {
        value: MessageBaseInfo,
        key: string,
        indexes: {
            'by-target': string,
            'by-mid': number,
            'by-sid': string,
            'by-cliid': string,
            'by-time': number,
        }
    }
}

export class GlideDb {

    db: IDBPDatabase<GlideDBSchema>

    init(uid: string): Observable<string> {
        return concat(
            fromPromise(this.openDb(uid)).pipe(
                map(r => `db init success, db:${r.name} version: ${r.version}`)
            ),
            this.getDb().pipe(
                map(r => "db ready"),
                catchError(e => "prepare db error " + e)
            ),
            of("db init complete")
        )
    }

    getDb(): Observable<IDBPDatabase<GlideDBSchema>> {
        // when db is not ready, retry 10 times, each time delay 100ms
        return new Observable<IDBPDatabase<GlideDBSchema>>(subscriber => {
            if (this.db) {
                subscriber.next(this.db)
                subscriber.complete()
            } else {
                subscriber.error('db not ready')
            }
        }).pipe(
            retry({count: 10, delay: 200, resetOnSuccess: true}),
        )
    }

    private async openDb(uid: string): Promise<IDBPDatabase<GlideDBSchema>> {
        const database = await openDB<GlideDBSchema>(`db_${uid}`, 1, {
            upgrade(db) {
                const s = db.createObjectStore('session', {
                    keyPath: 'ID'
                })
                s.createIndex('by-to', 'To')

                const m = db.createObjectStore('message', {
                    keyPath: 'CliId'
                })
                m.createIndex('by-target', 'Target')
                m.createIndex('by-mid', 'Mid')
                m.createIndex('by-sid', 'SID')
                m.createIndex('by-cliid', 'CliId')
                m.createIndex('by-time', 'ReceiveAt')
            },
            blocked(currentVersion: number, blockedVersion: number | null, event: IDBVersionChangeEvent) {
                console.log('db blocked')
            },
            blocking(currentVersion: number, blockedVersion: number | null, event: IDBVersionChangeEvent) {
                console.log('db blocking')
            },
            terminated() {
                console.log('db terminated')
            }
        })
        this.db = database
        return database
    }

    close(): Observable<any> {
        this.db.close()
        return of(null)
    }

    clean(): Observable<any> {
        return concat(
            fromPromise(this.db.clear('session')),
            fromPromise(this.db.clear('message'))
        )
    }
}

export class SessionDbCache implements SessionListCache {

    static version = 1
    private readonly _db: GlideDb

    constructor(db: GlideDb) {
        this._db = db
    }

    getSession(sid: string): Observable<SessionBaseInfo> {
        return fromPromise(this._db.db.get('session', sid))
    }

    setSession(sid: string, info: SessionBaseInfo): Observable<any> {
        return fromPromise(this._db.db.put('session', info))
    }

    clearAllSession(): Observable<any> {
        return fromPromise(this._db.db.clear('session'))
    }

    getAllSession(): Observable<SessionBaseInfo[]> {
        return this._db.getDb().pipe(
            mergeMap((db) => {
                return db.getAll('session')
            })
        )
        // return fromPromise(this._db.db.getAll('session'))
    }

    removeSession(sid: string): Observable<any> {
        return fromPromise(this._db.db.delete('session', sid))
    }

    containSession(sid: string): Observable<boolean> {
        return fromPromise(this._db.db.get('session', sid)).pipe(
            map(info => info != null)
        )
    }

    sessionCount(): Observable<number> {
        return fromPromise(this._db.db.count('session'))
    }
}

export class ChatMessageDbCache implements ChatMessageCache {

    private readonly _db: GlideDb

    constructor(db: GlideDb) {
        this._db = db
    }

    addMessage(message: MessageBaseInfo): Observable<any> {
        return fromPromise(this._db.db.add('message', message))
    }

    addMessages(messages: MessageBaseInfo[]): Observable<any> {
        return of(null)
    }

    updateMessage(message: MessageBaseInfo): Observable<any> {
        return fromPromise(this._db.db.put('message', message))
    }

    updateMessageStatus(cliId: number, status: MessageStatus): Observable<void> {
        return of(null)
    }

    deleteMessage(cliId: string): Observable<void> {
        return fromPromise(this._db.db.delete('message', cliId))
    }

    deleteMessageBySid(sid: string): Observable<void> {
        throw new Error("Method not implemented.");
    }

    getMessageByCliId(cliId: string): Observable<MessageBaseInfo> {
        return fromPromise(this._db.db.get('message', cliId))
    }

    getMessageByMid(mid: number): Observable<MessageBaseInfo> {
        throw new Error("Method not implemented.");
    }

    getSessionMessagesByTime(sid: string, beforeTime: number): Observable<MessageBaseInfo[]> {
        return fromPromise(this._db.db.getAllFromIndex('message', 'by-sid', IDBKeyRange.only(sid)))
    }

    getSessionMessageBySeq(sid: string, beforeSeq: number): Observable<MessageBaseInfo> {
        throw new Error("Method not implemented.");
    }

    getLatestSessionMessage(sid: string): Observable<MessageBaseInfo> {
        throw new Error("Method not implemented.");
    }
}