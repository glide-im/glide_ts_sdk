import {groupBy, map, mergeMap, Observable, of, toArray} from "rxjs";
import {UserInfoBean} from "src/api/model";
import {onNext} from "src/rx/next";
import {getCookie, setCookie} from "src/utils/Cookies";
import {Api} from "../api/api";
import {IMUserInfo} from "./def";

class cache {

    private tempUserInfo = new Map<string, IMUserInfo>();

    constructor() {
        this.tempUserInfo.set('system', {
            avatar: "",
            name: "system",
            uid: "system",
        })
    }

    public getToken(): string {
        return getCookie("token");
    }

    public storeToken(token: string) {
        setCookie("token", token, 1);
    }

    public getUserInfo(id: string): IMUserInfo | null {
        let i = this.tempUserInfo.get(id);
        if (i !== null && i !== undefined) {
            return i
        }
        const res = this._readObject(`ui_${id}`);
        if (res !== null) {
            this.tempUserInfo.set(id, res);
            console.log(res)
            return res
        }
        return null
    }

    public cacheUserInfo(id: string): Promise<any> {
        const execute = (resolved, reject) => {
            if (this.tempUserInfo.has(id)) {
                resolved()
                return
            }
            this.loadUserInfo(id).subscribe(r => {
                console.log('cache user info', this.tempUserInfo.get(id))
                resolved()
            }, r => {
                resolved()
            })
        }
        return new Promise<any>(execute)
    }

    public loadUserInfo(...id: string[]): Observable<IMUserInfo[]> {

        return of(...id).pipe(
            groupBy<string, boolean>(id => {
                return this.getUserInfo(id) != null;
            }),
            mergeMap(g => {
                if (g.key) {
                    return g.pipe(
                        map(id => this.getUserInfo(id)),
                    );
                } else {
                    return g.pipe(
                        toArray(),
                        mergeMap(ids => {
                            return Api.getUserInfo(...ids)
                        }),
                        mergeMap(userInfos => of(...userInfos)),
                        map<UserInfoBean, IMUserInfo>(u => ({
                            avatar: u.avatar,
                            name: u.nick_name,
                            uid: u.uid.toString()
                        })),
                    )
                }
            }),
            toArray(),
            onNext(userInfo => {
                userInfo.forEach(u => {
                    this._writeObject(`ui_${id}`, u);
                    this.tempUserInfo.set(u.uid, u);
                });
            })
        )
    }

    private _readObject(key: string): any | null {
        return null
        const val = localStorage.getItem(key);
        if (val === null) {
            return null;
        }
        return JSON.parse(val);
    }

    private _writeObject(key: string, val: any): void {
        localStorage.setItem(key, JSON.stringify(val));
    }
}

export const Cache = new cache();