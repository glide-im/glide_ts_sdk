import { groupBy, map, mergeMap, Observable, of, toArray } from "rxjs";
import { UserInfoBean } from "src/api/model";
import { onNext } from "src/rx/next";
import { Api } from "../api/api";
import { IMGroupMember, IMUserInfo } from "./def";

class GlideIM {

    private tempUserInfo = new Map<number, IMUserInfo>();
    private tempGroupMember = new Map<number, IMGroupMember[]>();

    public getToken(): string {
        return this._readObject("token");
    }

    public storeToken(token: string) {
        return this._writeObject("token", token);
    }

    public getUserInfo(id: number): IMUserInfo | null {
        let i = this.tempUserInfo.get(id);
        if (i != null) {
            return i
        } 
        return null        
        // const res = this._readObject(`ui_${id}`);
        // this.tempUserInfo.set(id, res);
        // return res
    }

    public loadUserInfo(...id: number[]): Observable<IMUserInfo[]> {

        return of(...id).pipe(
            groupBy<number, boolean>(id => {
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
                        map<UserInfoBean, IMUserInfo>(u => ({ avatar: u.Avatar, name: u.Nickname, uid: u.Uid })),
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

    public loadGroupMember(id: number): Promise<IMGroupMember> {
        return Promise.reject("not implemented");
    }

    private _readObject(key: string): any | null {
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

export const Glide = new GlideIM();
