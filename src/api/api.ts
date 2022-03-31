import {AuthBean, ContactsBean, SessionBean, UserInfoBean} from "./model";
import {post} from "./axios";

function login(account: string, password: string): Promise<AuthBean> {
    const param = {
        Account: account,
        Device: 2,
        Password: password
    };
    return post("auth/signin", param)
}

function auth(token: string): Promise<AuthBean> {
    const param = {
        Token: token
    };
    return post("auth/token", param)
}

function register(account: string, password: string): Promise<AuthBean> {
    const param = {
        Account: account,
        Password: password
    };
    return post("auth/register", param)
}

function getContacts(): Promise<ContactsBean[]> {
    return post("contacts/list")
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
    return post("user/info")
}

function getRecentSession(): Promise<SessionBean[]> {
    return post("session/recent")
}

function getOrCreateSession(to: number): Promise<SessionBean> {
    return post("session/get", {To: to})
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
    login
} as const;
