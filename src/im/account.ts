import {delCookie, getCookie, setCookie} from "../utils/Cookies";
import {setApiToken} from "../api/axios";
import {Api} from "../api/api";
import {AuthBean, UserInfoBean} from "../api/model";
import {Ws} from "./ws";
import {SessionList} from "./session_list";
import {Actions} from "./message";

export enum MessageLevel {
    // noinspection JSUnusedGlobalSymbols
    LevelDefault,
    LevelInfo,
    LevelError,
    LevelSuccess,
    LevelWarning
}

export type MessageListener = (level: MessageLevel, msg: string) => void

export class Account {

    private uid: string;
    private token: string;
    private sessions: SessionList = new SessionList();

    constructor() {
        this.uid = getCookie("uid") ?? "";
        this.token = getCookie("token") ?? "";
    }

    public login(account: string, password: string): Promise<any> {
        return Api.login(account, password)
            .then(res => {
                return this.onAuthedAccount(res).then(() => res);
            })
    }

    public auth(): Promise<AuthBean> {
        return Api.auth(this.token)
            .then(res => {
                return this.onAuthedAccount(res).then(() => res);
            })
            .catch(err => {
                this.clearAuth()
                return Promise.reject(err);
            })
    }

    public logout() {
        this.clearAuth()
        Ws.request(Actions.ApiUserLogout, {})
            .then();
        Ws.close()
    }

    public clearAuth() {
        this.uid = "";
        this.token = "";
        delCookie("uid");
        delCookie("token");
    }

    public getSessionList(): SessionList {
        return this.sessions;
    }

    public isAuthenticated(): boolean {
        return this.uid && this.uid !== "" && this.token && this.token !== "";
    }

    public getUID(): number {
        return parseInt(this.uid);
    }

    public getToken(): string {
        return this.token;
    }

    public getUserInfo(): UserInfoBean {
        return {Account: "", Avatar: "", Nickname: "Nickname", Uid: 0}
    }

    private onAuthedAccount(auth: AuthBean): Promise<any> {
        this.uid = auth.Uid.toString();
        this.token = auth.Token;

        setApiToken(auth.Token);

        setCookie("uid", this.uid.toString(), 1);
        setCookie("token", this.token, 1);

        return new Promise((resolve, reject) => {
            Ws.connect(auth.Servers[0], (s, m) => {
                if (s) {
                    Ws.request<AuthBean>(Actions.ApiUserAuth, {Token: this.getToken()})
                        .then(r => {
                            resolve(r);
                        })
                        .catch(err => {
                            reject(err);
                        });
                } else {
                    reject(m);
                }
            })
        })
    }
}

export const IMAccount = new Account();





