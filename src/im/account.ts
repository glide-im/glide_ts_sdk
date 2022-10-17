import {catchError, concat, map, mergeMap, Observable, timeout} from "rxjs";
import {onComplete} from "src/rx/next";
import {Api} from "../api/api";
import {setApiToken} from "../api/axios";
import {AuthBean} from "../api/model";
import {ContactsList} from "./contacts_list";
import {IMUserInfo} from "./def";
import {Cache} from "./cache";
import {Actions, CommonMessage} from "./message";
import {SessionList} from "./session_list";
import {Ws} from "./ws";
import {getCookie} from "../utils/Cookies";

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
    server: string = process.env.REACT_APP_WS_URL;
    token: string;

    constructor() {
        this.token = getCookie('token')
    }

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

    public guest(nickname: string, avatar: string): Observable<string> {
        return Api.guest(nickname, avatar)
            .pipe(
                mergeMap(res => this.initAccount(res)),
            )
    }

    public auth(): Observable<string> {
        return Api.auth(this.token)
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
        Ws.close()
    }

    public clearAuth() {
        console.log("clearAuth");
        this.uid = "";
        this.token = "";
        Ws.close();
        Cache.storeToken("");
    }

    public getSessionList(): SessionList {
        return this.sessions;
    }

    public getContactList(): ContactsList {
        return this.contacts;
    }

    public isAuthenticated(): boolean {
        return this.token && this.token !== "";
    }

    public getUID(): string {
        return this.uid;
    }

    public getUserInfo(): IMUserInfo | null {
        return this.userInfo;
    }

    private initAccount(auth: AuthBean): Observable<string> {

        setApiToken(auth.token);
        this.uid = auth.uid.toString();
        this.token = auth.token;
        Cache.storeToken(auth.token);

        const initUserInfo: Observable<string> = Cache.loadUserInfo(auth.uid.toString())
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

        const data = {Token: this.token};
        const server = this.server;

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
        switch (m.action) {
            // case Actions.NotifyContact:
            //     this.contacts.onNewContactNotify(m.data);
            //     break;
            case Actions.NotifyGroup:
            case Actions.MessageChat:
            case Actions.MessageGroup:
            case Actions.MessageChatRecall:
            case Actions.MessageGroupRecall:
                this.sessions.onMessage(m.action, m.data);
                break;
            case Actions.NotifyKickOut:
                alert("kick out");
                this.logout();
                break;
            case Actions.NotifyNeedAuth:
                this.logout();
                break;
        }
    }
}

const instance: Account = new Account();