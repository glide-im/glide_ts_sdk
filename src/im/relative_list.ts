import { catchError, concat, map, Observable, of, Subject, tap } from 'rxjs';
import { Api } from '../api/api';

export interface RelativeUser {
    Uid: string;
    Account: string;
    Nickname: string;
    email: string;
    Avatar: string;
}

interface RelativeUserBean {
    user_info: RelativeUser
    id: number
}

export interface RelativeList {
    getBlackRelativeList(): Array<RelativeUser>

    getBlackRelativeListID(): Array<string>

    addBlackRelativeList(id: string): Observable<any>

    removeBlackRelativeList(id: string): Observable<any>

    removeBlackRelativeLists(id: string[]): Observable<any>

    init(): Observable<string>

    event(Event: string): Observable<string>

    inUserBlackList(id: string): boolean
}

export enum Event {
    BlackListUpdate = "BlackListUpdate",
}

export class RelativeListImpl implements RelativeList {

    private blackRelativeList: Array<RelativeUser> = []
    private _subject = new Subject<{ event: Event, payload: any }>();

    private publish(event: Event, payload: any):Observable<any> {
        return new Observable((observer) => {
            this._subject.next({event: event, payload: payload})
            observer.complete()
        })
    }

    public event(Event: string): Observable<string> {
        return this._subject.asObservable().pipe(
            // filter((e) => e.event === Event),
            tap((e) => console.log(e)),
            map((e) => e.payload)
        )
    }

    public inUserBlackList(id: string): boolean {
        return this.blackRelativeList.some(u => u.Uid === id)
    }

    public init(): Observable<string> {
        return concat(
            of("start load relative list"),
            this.getOrInitContactList().pipe(
                map(() => "relative list sync from server success"),
                catchError(err => of("relative list sync from server failed, " + err))
            ),
            of("complete load relative list"),
        )
    }

    private getOrInitContactList(): Observable<any> {
        return Api.getBlacklistList().pipe(
            tap(relativeUsers => {
                this.blackRelativeList = []
                relativeUsers.forEach(u => {
                    const user = u as RelativeUserBean
                    this.blackRelativeList.push(Object.assign({}, user.user_info, {
                        Uid: user.user_info.Uid.toString(),
                    }))
                })
            }),
        )
    }

    public getBlackRelativeList(): Array<RelativeUser> {
        return this.blackRelativeList
    }

    public getBlackRelativeListID(): Array<string> {
        return this.blackRelativeList.map(u => u.Uid)
    }

    public addBlackRelativeList(id: string): Observable<any> {
        return concat(
            Api.addToBlackList([id]),
            this.init(),
            this.publish(Event.BlackListUpdate, null),
        )
    }

    public removeBlackRelativeList(id: string): Observable<any> {
        return concat(
            Api.removeFromBlackList([id]),
            this.init(),
            this.publish(Event.BlackListUpdate, null),
        )
    }

    public removeBlackRelativeLists(id: string[]): Observable<any> {
        return concat(
            Api.removeFromBlackList(id),
            this.init(),
            this.publish(Event.BlackListUpdate, null),
        )
    }
}