import {from, groupBy, map, mergeMap, Observable, of, toArray} from "rxjs";
import {Api} from "../api/api";
import {GlideChannelInfo, GlideUserInfo} from "./def";
import {onErrorResumeNext} from "rxjs/operators";
import {UserInfoBean} from "../api/model";
import {onNext} from "../rx/next";
import {getCookie, setCookie} from "../utils/Cookies";

class cache {

    private tempUserInfo = new Map<string, GlideUserInfo>();

    constructor() {
        this.tempUserInfo.set('system', {
            avatar: "https://im.dengzii.com/system.png",
            name: "系统",
            uid: "system",
        })
    }

    public getToken(): string {
        return getCookie("token");
    }

    public storeToken(token: string) {
        setCookie("token", token, 1);
    }

    public getUserInfo(id: string): GlideUserInfo | null {
        let i = this.tempUserInfo.get(id);
        if (i !== null && i !== undefined) {
            return i
        }
        const res = this._readObject(`ui_${id}`);
        if (res !== null) {
            this.tempUserInfo.set(id, res);
            console.log('[cache]', "restore cache user info", res)
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

    public getChannelInfo(id: string): GlideChannelInfo | null {
        if (id === 'the_world_channel') {
            return {avatar: "https://im.dengzii.com/world_channel.png", id: id, name: "世界频道",}
        }
        return {avatar: "", id: id, name: id}
    }

    public loadUserInfo1(id: string): Observable<GlideUserInfo> {
        const cache = this.getUserInfo(id);
        if (cache !== null) {
            return of(cache)
        }

        return from(Api.getUserInfo(id)).pipe(
            map<UserInfoBean[], GlideUserInfo>((us, i) => {
                const u = us[0];
                const m: GlideUserInfo = {
                    avatar: u.avatar,
                    name: u.nick_name,
                    uid: u.uid.toString(),
                }
                this._writeObject(`ui_${id}`, m);
                this.tempUserInfo.set(m.uid, m);
                return m;
            }),
            onErrorResumeNext(of({
                avatar: "-",
                name: `${id}`,
                uid: `${id}`,
            })),);

    }

    public loadUserInfo(...id: string[]): Observable<GlideUserInfo[]> {

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
                        map<UserInfoBean, GlideUserInfo>(u => ({
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

    public clean() {
        // this.tempUserInfo.clear();
        // TODO fix
        localStorage.clear();
    }

    private _readObject(key: string): any | null {
        const val = localStorage.getItem(key);
        if (val === null) {
            return null;
        }
        console.log('[cache]', "read cache", key, val)
        return JSON.parse(val);
    }

    private _writeObject(key: string, val: any): void {
        console.log('[cache]', "write cache", key, val)
        localStorage.setItem(key, JSON.stringify(val));
    }
}

export const Cache = new cache();
