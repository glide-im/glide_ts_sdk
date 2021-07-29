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
export const ActionUserChatHistory = MaskActionApi | 12
export const ActionUserChatInfo = MaskActionApi | 13

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
    Uid: number
}

export interface UserInfo {
    Uid: number
    Account: string
    Nickname: string
    Avatar: string
}

export interface IChat {
    Cid: number
    UcId: number
    Target: number
    ChatType: number
    Unread: number
    NewMessageAt: any
    ReadAt: any

    Avatar: string
    Title: string
    LatestMsg: string
}

export interface NewChat {
    Id: number,
    Type: number
}

export interface IChatMessage {
    Mid: number
    Cid: number
    SenderUid: number
    MessageType: number
    Message: string
    SendAt: number
}

export interface SendChatMessage {
    Cid: number
    UcId: number
    Receiver: number
    MessageType: number
    Message: string
}

export interface GroupMessage {
    ChatId: number
    Sender: number
    MessageType: number
    Message: string
    SendAt: string
}

export interface ChatHistoryRequest {
    Cid: number
    Time: number
    Type: number
}
