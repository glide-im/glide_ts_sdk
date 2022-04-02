import { catchError, map, merge, mergeMap, Observable, single } from "rxjs";
import { onComplete, onNext } from "src/rx/next";
import { Api } from "../api/api";
import { setApiToken } from "../api/axios";
import { AuthBean, UserInfoBean } from "../api/model";
import { Glide } from "./glide";
import { Actions } from "./message";
import { SessionList } from "./session_list";
import { Ws } from "./ws";

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
    private sessions: SessionList = new SessionList();
    private servers: string[] = [];
    private token: string;

    public static getInstance(): Account {
        return instance;
    }

    public login(account: string, password: string): Observable<string> {
        return Api.login(account, password)
            .pipe(
                mergeMap(res => this.connectIMServer(res)),
            )
    }

    public auth(): Observable<string> {

        return Api.auth(this.getToken())
            .pipe(
                mergeMap(res => {
                    return this.connectIMServer(res)
                }),
                catchError(err => {
                    this.clearAuth();
                    throw new Error("auth failed: " + err);
                })
            )
    }

    public logout() {
        this.clearAuth()
        Ws.request(Actions.ApiUserLogout, {})
            .subscribe({});
        Ws.close()
    }

    public clearAuth() {
        console.log("clearAuth");
        this.uid = "";
        Glide.storeToken("");
    }

    public getSessionList(): SessionList {
        return this.sessions;
    }

    public isAuthenticated(): boolean {
        return this.getToken() && this.getToken() !== "";
    }

    public getUID(): number {
        return parseInt(this.uid);
    }

    public getToken(): string {
        return Glide.getToken();
    }

    public getUserInfo(): UserInfoBean {
        return { Account: "", Avatar: "", Nickname: "Nickname", Uid: 0 }
    }

    private connectIMServer(auth: AuthBean): Observable<string> {

        setApiToken(auth.Token);
        this.uid = auth.Uid.toString();
        Glide.storeToken(auth.Token);

        const server = auth.Servers[0];
        const data = { Token: this.getToken() };

        const authWs = Ws.request<AuthBean>(Actions.ApiUserAuth, data)
            .pipe(
                map(() => "IM server auth success"),
            )

        return Ws.connect(server)
            .pipe(
                mergeMap(() => authWs),
                onComplete(() => {
                    Ws.addChatMessageListener(m => {
                        this.sessions.onChatMessage(m);
                    });
                }),
            )
    }
}

const instance: Account = new Account();