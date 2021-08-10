import {Group} from "./group";

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
export const ActionUserAddFriend = MaskActionApi | 14

export const ActionOnlineUser = MaskActionApi | 20

const MaskActionGroupApi = MaskActionApi | (1 << 21)

export const ActionGroupCreate = MaskActionGroupApi | 1
export const ActionGroupGetMember = MaskActionGroupApi | 2
export const ActionGroupJoin = MaskActionGroupApi | 3
export const ActionGroupExit = MaskActionGroupApi | 4
export const ActionGroupRemoveMember = MaskActionGroupApi | 5
export const ActionGroupInfo = MaskActionGroupApi | 6
export const ActionGroupUpdate = MaskActionGroupApi | 7
export const ActionGroupAddMember = MaskActionGroupApi | 8

export const MaskRespActionApi = 1 << 20
export const RespActionFailed = MaskRespActionApi | 1
export const RespActionSuccess = MaskRespActionApi | 2
export const RespActionUserUnauthorized = MaskRespActionApi | 3

export const ActionUserChatList = MaskActionApi | 6
export const ActionGroupMessage = 33554433
export const ActionChatMessage = 33554434
export const ActionHeartbeat = 1073741825
export const ActionEcho = 1073741924

const MaskRespActionNotify = 1 << 30
export const RespActionGroupRemoved = MaskRespActionNotify | 1
export const RespActionGroupApproval = MaskRespActionNotify | 3
export const RespActionGroupApproved = MaskRespActionNotify | 4
export const RespActionGroupRefused = MaskRespActionNotify | 5
export const RespActionEcho = MaskRespActionNotify | 100

export const RespActionFriendApproval = MaskRespActionNotify | 6
export const RespActionFriendApproved = MaskRespActionNotify | 7
export const RespActionFriendRefused = MaskRespActionNotify | 8

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

export interface Friend {
    Uid: number
    Remark: string
    AddTime: number
}

export interface IContacts {
    Id: number
    Name: string
    Avatar: string
    Type: number
}

export interface Relation {
    Groups: Group[]
    Friends: UserInfo[]
}

export interface IGroup {
    Gid: number,
    Name: string,
    Avatar: string,
    Owner: number,
    Mute: boolean,
    Notice: string,
    CreateAt: number
    Members: IGroupMember[]
}

export interface IGroupMember {
    Id: number
    Uid: number
    Type: number
    Avatar: string
    Remark: string
    Mute: boolean
    JoinAt: number
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
    Sender: number
    MessageType: number
    Message: string
    SendAt: number
}

export interface SendChatMessage {
    Cid: number
    UcId: number
    TargetId: number
    MessageType: number
    Message: string
    SendAt: number
}

export interface GroupAddMember {
    Gid: number
    Members: IGroupMember[]
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
