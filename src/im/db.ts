import {SessionListCache} from "./session_list";
import {SessionBaseInfo} from "./session";
import {DBSchema, IDBPDatabase, openDB} from "idb";
import {concat, map, Observable, of} from "rxjs";
import {fromPromise} from "rxjs/internal/observable/innerFrom";
import {MessageBaseInfo} from "./chat_message";
import {onNext} from "../rx/next";

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
        indexes: { 'by-target': string }
    }
}

export class GlideDb {

    private _db: IDBPDatabase<GlideDBSchema>

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
                }
            })
        ).pipe(
            onNext(db => {
                this._db = db
            }),
            map(() => this)
        )
    }

    close(): Observable<any> {
        this._db.close()
        return of(null)
    }

    clean(): Observable<any> {
        return concat(
            fromPromise(this._db.clear('session')),
            fromPromise(this._db.clear('message'))
        )
    }
}

export class SessionListDbCache implements SessionListCache {

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

