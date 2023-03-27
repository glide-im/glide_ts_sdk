const maskFromWeb = 1 << 30;
const maskMessageType = (1 << 31) | maskFromWeb;

// 客户端自定义消息的类型
export enum ClientMessageType {
    Inputing = 1,
}

// 聊天消息类型, 可以自定义, 但是需要客户端之间约定好
export enum MessageType {
    Text = 1,
    Image = 2,
    Audio = 3,
    Recall = 4,
    File = 5,
    Video = 6,
    Location = 7,
    RedEnvelope = 8,
    Transfer = 9,
    System = 10,
    Markdown = 11,
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

    AckMessage = 'ack.message',
    AckRequest = 'ack.request',
    AckNotify = 'ack.notify',

    Api = 'api',
    ApiFailed = 'api.failed',
    ApiSuccess = 'api.success',
    ApiUserAuth = 'api.auth',
    ApiUserLogout = 'api.user.logout',
    Heartbeat = 'heartbeat',
}

// 公共消息体
export interface CommonMessage<T> {
    seq: number;
    action: string;
    data: T;
    to: string | null;
    extra: Map<string, string> | null;
}

// 聊天消息
export interface Message {
    cliMid: string;
    mid: number;
    seq: number;
    from: string;
    to: string;
    type: number;
    content: string;
    sendAt: number;
    status: number;
    isMe?: boolean;
    isMeToo?: boolean;
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

// 客户端自定义控制类型消息
export interface CliCustomMessage {
    from: string;
    to: string;
    type: number;
    content: string | null;
}
