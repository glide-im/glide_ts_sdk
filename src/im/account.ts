import {catchError, concat, delay, map, mergeMap, Observable, of, timeout} from "rxjs";
import {Api} from "../api/api";
import {setApiToken} from "../api/axios";
import {AuthBean} from "../api/model";
import {ContactsList} from "./contacts_list";
import {GlideUserInfo} from "./def";
import {Cache, GlideCache} from "./cache";
import {Actions, CommonMessage} from "./message";
import {InternalSessionList, InternalSessionListImpl, SessionList} from "./session_list";
import {Ws} from "./ws";
import {getCookie} from "../utils/Cookies";
import {onComplete, onError, onNext} from "../rx/next";
import {GlideDb} from "./db";
import {onErrorResumeNext} from "rxjs/operators";

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
    private sessions: InternalSessionList = new InternalSessionListImpl(this);
    private contacts: ContactsList = new ContactsList();
    private cache: GlideCache = new GlideCache();
    server: string = process.env.REACT_APP_WS_URL;
    token: string;

    static instance: Account = new Account();

    constructor() {
        this.token = getCookie('token')
    }

    private userInfo: GlideUserInfo | null = null;

    public static session(): SessionList {
        return Account.instance.getSessionList();
    }

    public static getInstance(): Account {
        return Account.instance;
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
                onNext(res => {
                    console.log(res)
                }),
                onError(err => {
                    console.log("gust login failed ", err)
                })
            )
    }

    public auth(): Observable<string> {
        Cache.clean()
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
        this.sessions = new InternalSessionListImpl(this)
        this.contacts = new ContactsList()
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

    public getUserInfo(): GlideUserInfo | null {
        return this.userInfo;
    }

    private initAccount(auth: AuthBean): Observable<string> {

        setApiToken(auth.token);
        this.uid = auth.uid.toString();
        this.token = auth.token;
        Cache.storeToken(auth.token);

        const initUserInfo: Observable<string> = Cache.loadUserInfo1(this.getUID())
            .pipe(
                map(us => {
                    this.userInfo = us;
                    return "load user info success";
                })
            )

        return concat(
            this.initCache(),
            initUserInfo,
            this.sessions.init(this.cache),
            this.connectIMServer(),
        )
    }

    private initCache(): Observable<string> {
        return this.cache.init(this.getUID())
            .pipe(
                map(() => "cache init success"),
                catchError(err => `cache init failed ${err}`),
            )
    }

    private connectIMServer(): Observable<string> {

        const data = {Token: this.token};
        const server = this.server;

        const authWs = Ws.request<AuthBean>(Actions.ApiUserAuth, data)
            .pipe(
                map(() => "ws auth success"),
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
            case Actions.MessageCli:
            case Actions.NotifyGroup:
            case Actions.MessageChat:
            case Actions.MessageGroup:
            case Actions.MessageChatRecall:
            case Actions.MessageGroupRecall:
                this.sessions.onMessage(m);
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
