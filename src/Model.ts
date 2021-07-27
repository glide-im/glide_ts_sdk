export interface ChatMessage {
    Mid: number
    ChatId: number
    Sender: number
    MessageType: number
    Message: string
    SendAt: string
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
