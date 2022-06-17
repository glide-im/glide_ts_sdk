export interface AuthBean {
    Token: string
    Uid: number
    Servers: string[]
}

export interface ContactsBean {
    Id: string
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
    From: string
    To: string
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
    ID: string
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