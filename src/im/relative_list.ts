import {catchError, concat, map, Observable, of, tap} from "rxjs";
import {Api} from "../api/api";

interface RelativeUser {
    Uid: string
    Account: string
    Nickname: string
    email: string
    Avatar: string
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

    init(): Observable<string>
}

export class RelativeListImpl implements RelativeList {

    private blackRelativeList: Array<RelativeUser> = []

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
                relativeUsers.forEach(u => {
                    const user = u as RelativeUserBean
                    this.blackRelativeList.push(user.user_info)
                })
                console.log("relativeUsers", this.blackRelativeList)
            }),
        )
    }

    public getBlackRelativeList(): Array<RelativeUser> {
        return this.blackRelativeList
    }

    public getBlackRelativeListID(): Array<string> {
        return this.blackRelativeList.map(u => u.Uid.toString())
    }

    public addBlackRelativeList(id: string): Observable<any> {
        return concat(
            Api.addToBlackList([id]),
            this.init(),
        )
    }

    public removeBlackRelativeList(id: string): Observable<any> {
        return concat(
            Api.removeFromBlackList([id]),
            this.init(),
        )
    }
}