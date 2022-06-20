import { Observable } from "rxjs";
import { getBaseUrl, post, setBaseUrl } from "./axios";
import { AuthBean, ContactsBean, MessageBean, MidBean, ServerInfoBean, SessionBean, UserInfoBean } from "./model";
import { rxios } from "./rxios";


function login(account: string, password: string): Observable<AuthBean> {
    const param = {
        Account: account,
        Device: 2,
        Password: password
    };
    return rxios.post("auth/signin", param)
}

function guest(nickname:string, avatar:string): Observable<AuthBean> {
    const param = {
        Avatar: nickname,
        Nickname: avatar,
    };
    return rxios.post("auth/guest", param)
}

function auth(token: string): Observable<AuthBean> {
    const param = {
        Token: token
    };
    return rxios.post("auth/token", param)
}

function register(account: string, password: string): Promise<AuthBean> {
    const param = {
        Account: account,
        Password: password
    };
    return post("auth/register", param)
}

function getContacts(): Observable<ContactsBean[]> {
    return rxios.post("contacts/list")
}

function addContacts(uid: string): Promise<any> {
    const param = {
        Uid: uid,
        Remark: "",
    };
    return post("contacts/add", param)
}

function getProfile(): Promise<UserInfoBean> {
    return post("user/profile")
}

function getUserInfo(...uids: string[]): Promise<UserInfoBean[]> {
    return post("user/info", { Uid: uids.map(uid => parseInt(uid)) })
}

function getRecentSession(): Observable<SessionBean[]> {
    return rxios.post("session/recent")
}

function getMessageHistry(uid: string, beforeMid: number): Observable<MessageBean[]> {
    return rxios.post("msg/chat/history", { Uid: parseInt(uid), Before: beforeMid })
}

function getOrCreateSession(to: number): Promise<SessionBean> {
    return post("session/get", { To: to })
}

function getMid(): Observable<MidBean> {
    return rxios.post("msg/id")
}

function getServerInfo(): Observable<ServerInfoBean> {
    return rxios.get("app/info")
}

export const Api = {
    setBaseUrl,
    getBaseUrl,
    getUserInfo,
    getProfile,
    getRecentSession,
    getOrCreateSession,
    addContacts,
    getContacts,
    register,
    auth,
    login,
    getMid,
    getMessageHistry,
    getServerInfo,
    guest,
} as const;
