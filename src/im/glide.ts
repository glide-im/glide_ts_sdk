import { IMGroupMember, IMUserInfo } from "./def";
import { Api } from "../api/api";
import { getCookie, setCookie } from "src/utils/Cookies";

class GlideIM {

    private tempUserInfo = new Map<number, IMUserInfo>();
    private tempGroupMember = new Map<number, IMGroupMember[]>();

    public getToken(): string {
        return this._readObject("token");
    }

    public storeToken(token: string) {
        console.log("storeToken", token);
        
        return this._writeObject("token", token);
    }

    public getUserInfo(id: number): IMUserInfo | null {
        let i = this.tempUserInfo.get(id);
        if (i != null) {
            return i
        }
        return this._readObject(`ui_${id}`);
    }

    public loadUserInfo(id: number): Promise<IMUserInfo> {
        return new Promise((resolve, reject) => {
            let i = this.getUserInfo(id);
            if (i != null) {
                resolve(i);
            } else {
                Api.getUserInfo([id])
                    .then((r) => {
                        let u = r[0];
                        const ui: IMUserInfo = {
                            avatar: u.Avatar, name: u.Nickname, uid: u.Uid
                        };
                        this.tempUserInfo.set(id, ui);
                        this._writeObject(`ui_${id}`, ui);
                        resolve(ui);
                    })
                    .catch(reject);
            }
        });
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
