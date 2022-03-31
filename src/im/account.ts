import {delCookie, getCookie, setCookie} from "../utils/Cookies";
import {setApiToken} from "../api/axios";
import {Api} from "../api/api";
import {AuthBean, UserInfoBean} from "../api/model";
import {Ws} from "./ws";

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

    private uid_: string;
    private token_: string;

    constructor() {
        this.uid_ = getCookie("uid") ?? "";
        this.token_ = getCookie("token") ?? "";
    }

    public login(account: string, password: string): Promise<any> {
        return Api.login(account, password)
            .then(res => {
                return this.onAuthedAccount(res).then(() => res);
            })
    }

    public auth(): Promise<AuthBean> {
        return Api.auth(this.token_)
            .then(res => {
                setApiToken(this.token_);
                return this.onAuthedAccount(res).then(() => res);
            })
            .catch(err => {
                this.clearAuth()
                return Promise.reject(err);
            })
    }

    public logout() {
        this.clearAuth()
        Ws.close()
    }

    public clearAuth() {
        this.uid_ = "";
        this.token_ = "";
        delCookie("uid");
        delCookie("token");
    }

    public isAuthenticated(): boolean {
        return this.uid_ && this.uid_ !== "" && this.token_ && this.token_ !== "";
    }

    public getUID(): number {
        return parseInt(this.uid_);
    }

    public getToken(): string {
        return this.token_;
    }

    public getUserInfo(): UserInfoBean {
        return {Account: "", Avatar: "", Nickname: "Nickname", Uid: 0}
    }

    private initWebsocket() {

    }

    private onAuthedAccount(auth: AuthBean): Promise<any> {

        this.uid_ = auth.Uid.toString();
        this.token_ = auth.Token;
        setCookie("uid", this.uid_.toString(), 1);
        setCookie("token", this.token_, 1);

        return new Promise((resolve, reject) => {
            Ws.connect(auth.Servers[0], (s, m) => {
                if (s) {
                    this.initWebsocket()
                    resolve("ok");
                } else {
                    reject(m);
                }
            })
        })
    }
}

export const IMAccount = new Account();





