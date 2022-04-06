export interface AuthBean {
    Token: string
    Uid: number
    Servers: string[]
}

export interface ContactsBean {
    Id: number
    Type: number
    Remark: string
}

export interface UserInfoBean {
    Uid: number
    Account: string
    Nickname: string
    Avatar: string
}

export interface SessionBean {
    Uid1: number
    Uid2: number
    To: number
    Unread: number
    LastMid: number
    UpdateAt: number
    CreateAt: number
}

export interface MessageBean {
    Mid: number
    From: number
    To: number
    Type: number
    Content: string
    CreateAt: number
    SendAt: number
    Status: number
}

export interface MidBean {
    Mid: number
}

export interface OnlineUserInfoBean {
    ID: number
    AliveAt: number
    ConnectionAt: number
    Device: number
}

export interface ServerInfoBean {
    Online: number
    MaxOnline: number
    MessageSent: number
    StartAt: number
    OnlineCli: OnlineUserInfoBean[]
}