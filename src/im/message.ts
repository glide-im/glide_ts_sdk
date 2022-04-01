export enum MessageType {
    Text = 1,
    Image = 2,
    Audio = 3,
    Recall = 100,
    GroupNotify = -1,
}

export enum Actions {
    MessageChat = "message.chat",
    MessageChatRecall = "message.chat.recall",
    MessageChatResend = "message.chat.resend",
    MessageChatRetry = "message.chat.retry",
    MessageGroup = "message.group",
    MessageGroupRecall = "message.group.recall",

    NotifyNeedAuth = "notify.auth",
    NotifyKickOut = "notify.kickout",
    NotifyGroup = "notify.group",
    NotifyAccountLogin = "notify.login",

    AckMessage = "ack.message",
    AckRequest = "ack.request",
    AckGroupMsg = "ack.group.msg",
    AckNotify = "ack.notify",

    Api = "api",
    ApiFailed = "api.failed",
    ApiSuccess = "api.success",
    ApiUserAuth = "api.user.auth",
    ApiUserLogout = "api.user.logout",
    Heartbeat = "heartbeat",
}

export interface CommonMessage<T> {
    Seq: number
    Action: string
    Data: T
}

export interface Message {
    Mid: number
    Seq: number
    From: number
    To: number
    Type: number
    Content: string
    SendAt: number
}

export interface AckRequest {
    Seq: number
    Mid: string
    From: number
}

export interface AckGroupMessage {
    Seq: number
    Mid: string
    Gid: number
}

export interface AckNotify {
    Mid: string
}

export interface Recall {
    Mid: string,
    RecallBy: number,
}

export interface GroupNotify {
    Gid: number,
    Mid: string,
    Type: number,
    Timestamp: number,
    Seq: number,
    Data: string,
}
