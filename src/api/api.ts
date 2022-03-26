import {AuthResponse, ContactsResponse, SignInRequest, UserInfo} from "./params";
import {post} from "./axios";

export function login<T>(account: string, password: string): Promise<AuthResponse> {
    const param: SignInRequest = {
        Account: account,
        Device: 2,
        Password: password
    };
    return post("auth/signin", param)
}

export function register<T>(account: string, password: string): Promise<AuthResponse> {
    const param: SignInRequest = {
        Account: account,
        Device: 2,
        Password: password
    };
    return post("auth/signup", param)
}

export function getContacts(): Promise<ContactsResponse[]> {
    return post("contacts/list")
}

export function getProfile(): Promise<UserInfo> {
    return post("user/profile")
}

export function getUserInfo(uids: number[]): Promise<UserInfo[]> {
    return post("user/info")
}

export function getSessionList() {

}

export function auth() {

}
