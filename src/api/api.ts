import {Observable} from "rxjs";
import {getBaseUrl, post, setBaseUrl} from "./axios";
import {AuthBean, ContactsBean, MessageBean, MidBean, ServerInfoBean, SessionBean, UserInfoBean} from "./model";
import {rxios} from "./rxios";


function login(account: string, password: string): Observable<AuthBean> {
    const param = {
        Email: account,
        Device: 2,
        Password: password
    };
    return rxios.post("auth/signin", param)
}

function guest(nickname: string, avatar: string): Observable<AuthBean> {
    const param = {
        avatar: avatar,
        nickname: nickname,
    };
    return rxios.post("auth/guest", param)
}

function verifyCode(email: string): Observable<any> {
    return rxios.post('auth/verifyCode', {email: email, mode: 'register'})
}

function auth(token: string): Observable<AuthBean> {
    const param = {
        Token: token
    };
    return rxios.post("auth/token", param)
}

function register(email: string, nickname: string, captcha: string, password: string): Promise<AuthBean> {
    const param = {
        nickname: nickname,
        email: email,
        captcha: captcha,
        password: password
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
    return post("user/info", {Uid: uids.map(uid => parseInt(uid))})
}

function getRecentSession(): Observable<SessionBean[]> {
    return rxios.post("session/recent")
}

function getMessageHistry(uid: string, beforeMid: number): Observable<MessageBean[]> {
    return rxios.post("msg/chat/history", {Uid: parseInt(uid), Before: beforeMid})
}

function getOrCreateSession(to: number): Promise<SessionBean> {
    return post("session/get", {To: to})
}

function getMid(): Observable<MidBean> {
    return rxios.post("msg/id")
}

function getServerInfo(): Observable<ServerInfoBean> {
    return rxios.get("app/info")
}

function updateProfile(avatar: string, nickname: string): Observable<any> {
    return rxios.post('profile/update', {
        avatar: avatar,
        nick_name: nickname
    })
}

function addToBlackList(ids: Array<string>): Observable<any> {
    return rxios.post('session/blacklist/add', {
        relative_ids: ids.map(id => id),
    })
}

function getBlacklistList(): Observable<any> {
    return rxios.get('session/blacklist')
}

function removeFromBlackList(ids: Array<string>): Observable<any> {
    return rxios.post('session/blacklist/remove', {
        relative_ids: ids.map(id => id),
    })
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
    updateProfile,
    verifyCode,
    auth,
    login,
    getMid,
    getMessageHistry,
    getServerInfo,
    guest,
    addToBlackList,
    removeFromBlackList,
    getBlacklistList
} as const;
