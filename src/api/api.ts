import {AuthBean, ContactsBean, SessionBean, UserInfoBean} from "./model";
import {post} from "./axios";

export function login<T>(account: string, password: string): Promise<AuthBean> {
    const param = {
        Account: account,
        Device: 2,
        Password: password
    };
    return post("auth/signin", param)
}

export function auth<T>(token: string): Promise<AuthBean> {
    const param = {
        Token: token
    };
    return post("auth/token", param)
}

export function register<T>(account: string, password: string): Promise<AuthBean> {
    const param = {
        Account: account,
        Password: password
    };
    return post("auth/register", param)
}

export function getContacts(): Promise<ContactsBean[]> {
    return post("contacts/list")
}

export function getProfile(): Promise<UserInfoBean> {
    return post("user/profile")
}

export function getUserInfo(uids: number[]): Promise<UserInfoBean[]> {
    return post("user/info")
}

export function getRecentSession(): Promise<SessionBean[]> {
    return post("session/recent")
}

export function getOrCreateSession(to: number): Promise<SessionBean> {
    return post("session/get", {To: to})
}
