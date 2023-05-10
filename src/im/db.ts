import {SessionListCache} from "./session_list";
import {SessionBaseInfo} from "./session";
import {DBSchema, IDBPDatabase, openDB} from "idb";
import {concat, map, Observable, of} from "rxjs";
import {fromPromise} from "rxjs/internal/observable/innerFrom";
import {ChatMessageCache, MessageBaseInfo} from "./chat_message";
import {onNext} from "../rx/next";
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

    init(uid: string): Observable<GlideDb> {
        return fromPromise(
            openDB<GlideDBSchema>(`db_${uid}`, 1, {
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
                }
            })
        ).pipe(
            onNext(db => {
                this.db = db
            }),
            map(() => this)
        )
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
    private readonly _db: IDBPDatabase<GlideDBSchema>

    constructor(db: IDBPDatabase<GlideDBSchema>) {
        this._db = db
    }

    get(sid: string): Observable<SessionBaseInfo> {
        return fromPromise(this._db.get('session', sid))
    }

    set(sid: string, info: SessionBaseInfo): Observable<any> {
        return fromPromise(this._db.put('session', info))
    }

    clear(): Observable<any> {
        return fromPromise(this._db.clear('session'))
    }

    getAll(): Observable<SessionBaseInfo[]> {
        return fromPromise(this._db.getAll('session'))
    }

    remove(sid: string): Observable<any> {
        return fromPromise(this._db.delete('session', sid))
    }

    contain(sid: string): Observable<boolean> {
        return fromPromise(this._db.get('session', sid)).pipe(
            map(info => info != null)
        )
    }

    size(): Observable<number> {
        return fromPromise(this._db.count('session'))
    }
}

export class ChatMessageDbCache implements ChatMessageCache {

    private readonly _db: IDBPDatabase<GlideDBSchema>

    constructor(db: IDBPDatabase<GlideDBSchema>) {
        this._db = db
    }

    add(message: MessageBaseInfo): Observable<any> {
        return fromPromise(this._db.add('message', message))
    }

    addAll(messages: MessageBaseInfo[]): Observable<any> {
        return of(null)
    }

    update(message: MessageBaseInfo): Observable<any> {
        return fromPromise(this._db.put('message', message))
    }

    updateStatus(cliId: number, status: MessageStatus): Observable<void> {
        return of(null)
    }

    delete(cliId: string): Observable<void> {
        return fromPromise(this._db.delete('message', cliId))
    }

    deleteBySid(sid: string): Observable<void> {
        throw new Error("Method not implemented.");
    }

    getByCliId(cliId: string): Observable<MessageBaseInfo> {
        return fromPromise(this._db.get('message', cliId))
    }

    getByMid(mid: number): Observable<MessageBaseInfo> {
        throw new Error("Method not implemented.");
    }

    getSessionMessagesByTime(sid: string, beforeTime: number): Observable<MessageBaseInfo[]> {
        return fromPromise(this._db.getAllFromIndex('message', 'by-sid', IDBKeyRange.only(sid)))
    }

    getSessionMessageBySeq(sid: string, beforeSeq: number): Observable<MessageBaseInfo> {
        throw new Error("Method not implemented.");
    }

    getLatestSessionMessage(sid: string): Observable<MessageBaseInfo> {
        throw new Error("Method not implemented.");
    }
}