import {catchError, concat, flatMap, map, mergeMap, Observable, of, tap, throwError, timeout, toArray} from "rxjs";
import {Api} from "../api/api";
import {setApiToken} from "../api/axios";
import {AuthBean} from "../api/model";
import {ContactsList} from "./contacts_list";
import {GlideBaseInfo} from "./def";
import {Cache, GlideCache} from "./cache";
import {Actions, AuthenticateData, CommonMessage} from "./message";
import {InternalSessionList, InternalSessionListImpl, SessionList} from "./session_list";
import {IMWsClient} from "./im_ws_client";
import {getCookie} from "../utils/Cookies";
import {onError} from "../rx/next";
import {Logger} from "../utils/Logger";
import {isResponse} from "../api/response";
import {showSnack} from "../component/widget/SnackBar";

export class Account {

    private tag = "Account";

    private uid: string;
    private sessions: InternalSessionList
    private contacts: ContactsList
    private readonly cache: GlideCache
    server: string = process.env.REACT_APP_WS_URL;
    token: string;

    static instance: Account = new Account();

    constructor() {
        this.token = getCookie('token')
        this.cache = new GlideCache()
        this.contacts = new ContactsList()
        this.sessions = new InternalSessionListImpl(this, this.cache)
    }

    private userInfo: GlideBaseInfo | null = null;

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
                tap(res => {
                    Logger.log(this.tag, "Login", res)
                }),
                toArray(),
                map(res => "login success"),
                onError(err => {
                    Logger.error(this.tag, "Login", "auth failed", err)
                }),
                catchError(err => throwError(() => new Error(err)))
            )
    }

    public guest(nickname: string, avatar: string): Observable<string> {

        return Api.guest(nickname, avatar)
            .pipe(
                mergeMap(res => this.initAccount(res)),
                tap(res => {
                    Logger.log(this.tag, "GustLogin", res)
                }),
                onError(err => {
                    Logger.error(this.tag, "GustLogin", "auth failed", err)
                }),
                catchError(err => throwError(() => new Error(err)))
            )
    }

    public auth(): Observable<string> {
        return Api.auth(this.token)
            .pipe(
                mergeMap(res => {
                    return this.initAccount(res)
                }),
                tap(res => {
                    Logger.log(this.tag, "TokenAuth", res)
                }),
                timeout(3000),
                catchError(err => {
                    this.clearAuth()

                    if (isResponse(err)) {
                        this.clearAuth()
                    }
                    return throwError(err)
                }),
                catchError(err => throwError(() => new Error(err)))
            )
    }

    public logout() {
        this.sessions = new InternalSessionListImpl(this, this.cache)
        this.contacts = new ContactsList()
        this.clearAuth()
        IMWsClient.close()
    }

    public clearAuth() {
        Logger.log(this.tag, "clean auth info");
        this.uid = "";
        this.token = "";
        IMWsClient.close();
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

    public getUserInfo(): GlideBaseInfo | null {
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
                    return `init account info success ${us.id}, ${us.name}`
                })
            )

        return concat(
            this.initCache(),
            initUserInfo,
            this.sessions.init(this.cache),
            IMWsClient.connect(this.server),
            of("ws not ready, skip auth").pipe(
                mergeMap((s) =>
                    IMWsClient.isReady() ? this.authWs(false) : of(s),
                )
            )
        )
    }

    private initCache(): Observable<string> {
        return concat(
            of("cache init start"),
            this.cache.init(this.getUID())
                .pipe(
                    catchError(err => of(`cache init failed ${err}`)),
                ),
            of("cache init complete"),
        )
    }

    private authWs(v2: boolean): Observable<string> {

        let request: Observable<CommonMessage<any>>

        if (v2) {
            const credentials: AuthenticateData = {
                credential: "",
                version: 1
            }
            request = IMWsClient.request(Actions.Authenticate, credentials)
        } else {
            request = IMWsClient.request(Actions.ApiUserAuth, {Token: this.token})
        }

        return concat(
            of("ws auth start"),
            request.pipe(
                map(() => "ws auth success"),
                tap(() => {
                    this.startHandleMessage()
                }),
                catchError(err => {
                    if (err.hasOwnProperty("name") && err.name === "TimeoutError") {
                        return throwError(() => "ws auth timeout");
                    } else {
                        return throwError(() => err.message ?? "");
                    }
                }),
            )
        )
    }

    private startHandleMessage() {

        IMWsClient.messages().subscribe({
            next: (m: CommonMessage<any>) => {
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
                        showSnack("kick out");
                        this.logout();
                        break;
                    case Actions.NotifyNeedAuth:
                        this.logout();
                        break;
                }
            },
            error: (err) => {
                Logger.error(this.tag, "ws messages error", err)
            },
            complete: () => {
                Logger.log(this.tag, "ws messages complete")
            }
        });


    }
}
