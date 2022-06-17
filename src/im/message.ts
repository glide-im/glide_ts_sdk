export enum MessageType {
    Text = 1,
    Image = 2,
    Audio = 3,
    Recall = 100,
    GroupNotify = -1,
}

export enum SessionType {
    Single = 1,
    Group = 2,
}

export enum Actions {
    MessageChat = "message.chat",
    MessageChatRecall = "message.chat.recall",
    MessageChatResend = "message.chat.resend",
    MessageChatRetry = "message.chat.retry",
    MessageGroup = "message.group",
    MessageGroupRecall = "message.group.recall",

    NotifyNeedAuth = "notify.auth",
    NotifyContact = "notify.contact",
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
    ApiUserAuth = "api.auth",
    Heartbeat = "heartbeat",
}

export interface CommonMessage<T> {
    seq: number
    action: string
    to: string
    data: T
}

export interface Message {
    mid: number
    seq: number
    from: string
    to: string
    type: number
    content: string
    sendAt: number
    status: number
}

export interface AckRequest {
    mid: number
    from: string
}

export interface AckGroupMessage {
    seq: number
    mid: number
    gid: number
}

export interface AckNotify {
    mid: number
}

export interface AckMessage {
    mid: number
}

export interface Recall {
    mid: string,
    recall_by: number,
}

export interface GroupNotify {
    gid: number,
    mid: number,
    type: number,
    timestamp: number,
    seq: number,
    data: string,
}

export interface ContactNotify {
    FromId: string,
    FromType: number,
    Id: string,
    Type: number
}