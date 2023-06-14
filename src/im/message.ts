// 聊天消息类型, 可以自定义, 但是需要客户端之间约定好

export enum MessageType {
    Text = 1,
    Image = 2,
    Audio = 3,
    Video = 4,
    File = 5,
    Location = 6,
    RedEnvelope = 8,
    Transfer = 9,
    System = 10,
    Markdown = 11,

    Recall = 200,
    Forward = 201,
    Reply = 202,

    UserOnline = 100,
    UserOffline = 101,

    StreamMarkdown = 1011,
    StreamText = 1001,

    // todo move to ClientCustomType
    WebRtcHi = 2000,
    WebRtcHello = 2001,
    WebRtcDialing = 2002,
    WebRtcAccept = 2003,
    WebRtcReject = 2004,
    WebRtcHangup = 2005,
    WebRtcCancel = 2006,
    WebRtcOffer = 2007,
    WebRtcAnswer = 2008,
    WebRtcIce = 2009,
    WebRtcClose = 2010,
    WebRtcCandidate = 2011,
}

export enum ClientCustomType {
    CliMessageTypeTyping = 1,
}

export enum MessageStatus {
    Sending = 0,
    Success = 1,
    Failed = 2,
    Recall = 3,

    StreamStart = 1,
    StreamSending = 2,
    StreamFinish = 3,
    StreamCancel = 4,
}

export const WebSocketUrl = process.env.REACT_APP_WS_URL;

// IM 指令
export enum Actions {
    // 聊天消息
    MessageChat = 'message.chat',
    // 消息撤回
    MessageChatRecall = 'message.chat.recall',
    MessageChatResend = 'message.chat.resend',
    MessageChatRetry = 'message.chat.retry',

    MessageGroupRecall = 'message.group.recall',
    MessageGroup = 'message.group',

    NotifyGroup = 'group.notify',

    // 客户端控制消息
    MessageCli = 'message.cli',
    // 需要认证
    NotifyNeedAuth = 'notify.auth',
    // 被踢出
    NotifyKickOut = 'notify.kickout',
    // 新的联系人
    NotifyNewContact = 'notify.contact',
    NotifySuccess = 'notify.success',
    NotifyError = 'notify.error',
    NotifyForbidden = 'notify.forbidden',

    EventUserOnline = 'event.user.online',
    EventUserOffline = 'event.user.offline',
    EventTicketUpdate = 'event.ticket.update',

    AckMessage = 'ack.message',
    AckRequest = 'ack.request',
    AckNotify = 'ack.notify',

    Authenticate = 'authenticate',

    Api = 'api',
    ApiFailed = 'api.failed',
    ApiSuccess = 'api.success',
    ApiUserState = 'api.user.state',
    ApiUserAuth = 'api.auth',
    ApiUserLogout = 'api.user.logout',
    Heartbeat = 'heartbeat',
}

// 公共消息体
export interface CommonMessage<T> {
    seq: number;
    action: Actions;
    data: T;
    to?: string | null;
    from?: string | null;
    extra?: Map<string, string> | null;
    ticket?: string | null;
}

// 聊天消息
export interface Message {
    cliMid: string | null;
    mid: number;
    seq: number;
    from: string;
    to: string;
    type: number;
    content: string;
    sendAt: number;
    status: number;
}

// 接收者收到确认请求
export interface AckRequest {
    mid: number;
    from: string;
}

// 接收者收到确认通知
export interface AckNotify {
    mid: number;
}

// 服务器收到确认
export interface AckMessage {
    cliMid: string;
    mid: number;
}

// 撤回
export interface Recall {
    mid: number;
    recallBy: string;
}

export interface Reply {
    replyTo: Message;
    content: string;
}

// 客户端自定义控制类型消息
export interface CliCustomMessage {
    from: string;
    to: string;
    type: ClientCustomType;
    id: number;
    content: string | null;
}

// 登录 ws 服务的凭据, 从业务接口获取, 用于 ws 连接时的认证, 有效期 30 秒
export interface AuthenticateData {
    version: number;
    credential: string;
}

export interface UserStatusData {
    uid: string;
    device: string;
    online: boolean;
    onlineAt: number;
}
