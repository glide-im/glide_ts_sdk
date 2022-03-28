import {SessionBean} from "../api/model";
import {ChatMessage} from "./chat_message";

export class Session {

    public ID: string;
    public Avatar: string;
    public Title: string;
    public UpdateAt: string;
    public LastMessageSender: string;
    public LastMessage: string;
    public UnreadCount: number;
    public Type: number;

    constructor() {

    }

    public sendTextMessage(msg: string): Promise<ChatMessage> {
        return new Promise<ChatMessage>((resolve, reject) => {
            let chatMessage = new ChatMessage()
            resolve(chatMessage);
        });
    }

    public setUpdateListener(listener: (session: Session) => void) {

    }

    public setMessageListener(listener: (message: ChatMessage) => void) {

    }

    public GetAllMessage(): ChatMessage[] {
        return [];
    }

    public GetLastMessage(): string {
        return this.LastMessage;
    }

    public static fromSessionBean(sb: SessionBean): Session {
        let session = new Session();
        session.ID = sb.Uid1 + "_" + sb.Uid2;
        session.Title = session.ID;
        session.UpdateAt = "-";
        session.LastMessageSender = "-";
        session.LastMessage = '-';
        session.UnreadCount = 0;
        return session;
    }
}