import { Observable } from "rxjs";
import { post } from "./axios";
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

function addContacts(uid: number): Promise<ContactsBean> {
    const param = {
        Uid: uid,
        Remark: "",
    };
    return post("contacts/add", param)
}

function getProfile(): Promise<UserInfoBean> {
    return post("user/profile")
}

function getUserInfo(uids: number[]): Promise<UserInfoBean[]> {
    return post("user/info", { Uids: uids })
}

function getRecentSession(): Observable<SessionBean[]> {
    return rxios.post("session/recent")
}

function getMessageHistry(uid: number, beforeMid: number): Observable<MessageBean[]> {
    return rxios.post("msg/chat/history", { Uid: uid, Before: beforeMid })
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
    getServerInfo
} as const;
