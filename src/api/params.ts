export interface SignInRequest {
    Device: number
    Account: string
    Password: string
}

export interface AuthResponse {
    Token: string
    Uid: number
    Servers: string[]
}

export interface ContactsResponse {
    Id: number
    Type: number
    Remark: string
}

export interface UserInfo {
    Uid: number
    Nickname: string,
    Avatar: string
}
