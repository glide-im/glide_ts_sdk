import {Group} from "./group";


export const ActionUserLogin = "api.user.login"
export const ActionUserRegister = "api.user.register"
export const ActionUserGetInfo = "api.user.info.get"
export const ActionUserEditInfo = ""
export const ActionUserLogout = ""
export const ActionUserChatList = "api.chat.list"
export const ActionUserInfo = ""
export const ActionUserAuth = ""
export const ActionContactsGet = "api.contacts.get"
export const ActionUserNewChat = "api.chat.new"
export const ActionUserChatHistory = "api.chat.history"
export const ActionUserChatInfo = "api.chat.info"
export const ActionUserAddFriend = "api.contacts.add"

export const ActionOnlineUser = "api.user.online"

export const ActionGroupCreate = "api.group.create"
export const ActionGroupGetMember = "api.group.member"
export const ActionGroupJoin = "api.group.join"
export const ActionGroupExit = "api.group.exit"
export const ActionGroupRemoveMember = "api.group.member.add"
export const ActionGroupInfo = "api.group.info"
export const ActionGroupUpdate = "api.group.update"
export const ActionGroupAddMember = "api.group.member.add"

export const ActionGroupMessage = "message.group"
export const ActionChatMessage = "message.chat"

export const ActionFailed = "failed"
export const ActionUserUnauthorized = "api.user.unauthorized"
export const ActionNotify = "notify"
export const ActionHeartbeat = "heartbeat"
export const ActionEcho = "api.app.echo"

export interface Message {
    Seq: number
    Action: string
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

export interface ContactsResponse {
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

export interface AddGroup {
    Group: IGroup,
    UcId: number
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
