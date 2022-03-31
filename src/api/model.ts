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
    Unread: number
    LastMid: number
    UpdateAt: number
    CreateAt: number
}

export interface MidBean {
    Mid: number
}
