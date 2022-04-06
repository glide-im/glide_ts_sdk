import { catchError, map, mergeMap, Observable } from "rxjs";
import { onComplete } from "src/rx/next";
import { Api } from "../api/api";
import { setApiToken } from "../api/axios";
import { AuthBean, UserInfoBean } from "../api/model";
import { Contacts } from "./contacts";
import { ContactsList } from "./contacts_list";
import { Glide } from "./glide";
import { Actions, CommonMessage } from "./message";
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
    private sessions: SessionList = new SessionList(this);
    private contacts: ContactsList = new ContactsList();
    private servers: string[] = [];
    private token: string;

    public static getInstance(): Account {
        return instance;
    }

    public login(account: string, password: string): Observable<string> {
        return Api.login(account, password)
            .pipe(
                mergeMap(res => this.initAccount(res)),
            )
    }

    public auth(): Observable<string> {

        return Api.auth(this.getToken())
            .pipe(
                mergeMap(res => {
                    return this.initAccount(res)
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

    public getContactList(): ContactsList {
        return this.contacts;
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

    private initAccount(auth: AuthBean): Observable<string> {

        setApiToken(auth.Token);
        this.uid = auth.Uid.toString();
        this.servers = auth.Servers;
        this.token = auth.Token;
        Glide.storeToken(auth.Token);

        this.sessions.init();

        return this.connectIMServer()
    }

    private connectIMServer(): Observable<string> {

        const data = { Token: this.getToken() };
        const server = this.servers[0];

        const authWs = Ws.request<AuthBean>(Actions.ApiUserAuth, data)
            .pipe(
                map(() => "IM server auth success"),
            )

        return Ws.connect(server)
            .pipe(
                mergeMap(() => authWs),
                onComplete(() => Ws.addMessageListener((r) => {
                    this.onMessage(r)
                })),
            )
    }

    private onMessage(m: CommonMessage<any>) {
        switch (m.Action) {
            case Actions.MessageChat:
            case Actions.MessageGroup:
            case Actions.MessageChatRecall:
            case Actions.MessageGroupRecall:
                this.sessions.onMessage(m.Data);
                break;
            case Actions.NotifyKickOut:
                break;
            case Actions.NotifyNeedAuth:

                break;
        }
    }
}

const instance: Account = new Account();