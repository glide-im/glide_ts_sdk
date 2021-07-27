const MaskActionApi = 1 << 20

export const ActionUserLogin = MaskActionApi | 1
export const ActionUserRegister = MaskActionApi | 2
export const ActionUserGetInfo = MaskActionApi | 3
export const ActionUserRelation = MaskActionApi | 10
export const ActionUserEditInfo = MaskActionApi | 4
export const ActionUserLogout = MaskActionApi | 5
export const ActionUserSyncMsg = MaskActionApi | 6
export const ActionUserInfo = MaskActionApi | 7
export const ActionUserNewChat = MaskActionApi | 11

export const ActionOnlineUser = MaskActionApi | 20

export const MaskRespActionApi = 1 << 20
export const RespActionFailed = MaskRespActionApi | 1
export const RespActionSuccess = MaskRespActionApi | 2
export const RespActionUserUnauthorized = MaskRespActionApi | 3

export const ActionUserChatList = MaskActionApi | 6
export const ActionGroupMessage = 33554433
export const ActionChatMessage = 33554434
export const ActionHeartbeat = 1073741825
export const ActionEcho = 1073741924

export interface Message {
    Seq: number
    Action: number
    Data: string
}

export interface AuthResponse {
    Token: string
}

export interface SearchUser {
    Uid: number
    Account: string
    Nickname: string
    Avatar: string
}

export interface Chat {
    Cid: number
    UcId: number
    Target: number
    ChatType: number
    Unread: number
    NewMessageAt: any
    ReadAt: any
}

export interface NewChat {
    Id: number,
    Type: number
}
