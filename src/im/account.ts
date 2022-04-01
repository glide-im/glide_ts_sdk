import { mergeMap, Observable } from "rxjs";
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

    public static getInstance(): Account {
        return instance;
    }

    public login(account: string, password: string): Observable<string> {
        return Api.login(account, password)
            .pipe(
                mergeMap(res => this.onAuthed(res)),
            )
    }

    public auth(): Observable<string> {

        console.log("auth", this.getToken());

        return Api.auth(this.getToken())
            .pipe(
                mergeMap(res => {
                    res.Token = this.getToken();
                    return this.onAuthed(res)
                }),
                // catchError(err => {
                //     //this.clearAuth();
                //     throw new Error("auth failed: " + err);
                // })
            )
    }

    public logout() {
        this.clearAuth()
        Ws.request(Actions.ApiUserLogout, {})
            .then();
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

    private onAuthed(auth: AuthBean): Observable<string> {

        setApiToken(auth.Token);
        this.uid = auth.Uid.toString();
        Glide.storeToken(auth.Token);

        return new Observable<string>(observer => {

            Ws.connect(auth.Servers[0], (s, m) => {
                if (s) {
                    observer.next("IM server connected");
                    Ws.request<AuthBean>(Actions.ApiUserAuth, { Token: this.getToken() })
                        .then(r => {
                            observer.next("IM server auth success");
                        })
                        .catch(err => {
                            observer.error(err);
                        });
                } else {
                    observer.error(m);
                }
            })
            observer.complete();
        });
    }
}

const instance: Account = new Account();