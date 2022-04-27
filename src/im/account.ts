import { catchError, concat, map, mergeMap, Observable, timeout } from "rxjs";
import { onComplete } from "src/rx/next";
import { Api } from "../api/api";
import { setApiToken } from "../api/axios";
import { AuthBean } from "../api/model";
import { ContactsList } from "./contacts_list";
import { IMUserInfo } from "./def";
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

    private userInfo: IMUserInfo | null = null;

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
                timeout(5000),
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
        this.token = "";
        Ws.close();
        Glide.storeToken("");
    }

    public getSessionList(): SessionList {
        return this.sessions;
    }

    public getContactList(): ContactsList {
        return this.contacts;
    }

    public isAuthenticated(): boolean {
        const tk = this.getToken()
        return tk && tk !== "";
    }

    public getUID(): number {
        return parseInt(this.uid);
    }

    public getToken(): string {
        return Glide.getToken();
    }

    public getUserInfo(): IMUserInfo | null {
        return this.userInfo;
    }

    private initAccount(auth: AuthBean): Observable<string> {

        setApiToken(auth.Token);
        this.uid = auth.Uid.toString();
        this.servers = auth.Servers;
        this.token = auth.Token;
        Glide.storeToken(auth.Token);

        const initUserInfo: Observable<string> = Glide.loadUserInfo(auth.Uid)
            .pipe(
                map(us => {
                    this.userInfo = us[0];
                    return "load user info success";
                })
            )

        return concat(
            initUserInfo,
            this.connectIMServer(),
            this.sessions.init()
        )
    }

    private connectIMServer(): Observable<string> {

        const data = { Token: this.getToken() };
        const server = this.servers[0];

        const authWs = Ws.request<AuthBean>(Actions.ApiUserAuth, data)
            .pipe(
                map(() => "IM auth success"),
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
        console.log("onMessage", m);
        switch (m.Action) {
            case Actions.NotifyContact:
                this.contacts.onNewContactNotify(m.Data);
                break;
            case Actions.MessageChat:
            case Actions.MessageGroup:
            case Actions.MessageChatRecall:
            case Actions.MessageGroupRecall:
                this.sessions.onMessage(m.Action, m.Data);
                break;
            case Actions.NotifyKickOut:
                break;
            case Actions.NotifyNeedAuth:

                break;
        }
    }
}

const instance: Account = new Account();