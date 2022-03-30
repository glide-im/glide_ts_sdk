import {SessionBean} from "../api/model";
import {ChatMessage} from "./chat_message";
import {IMAccount} from "./client";

export class Session {

    public ID: string;
    public Avatar: string;
    public Title: string;
    public UpdateAt: string;
    public LastMessageSender: string;
    public LastMessage: string;
    public UnreadCount: number;
    public Type: number;
    public To: number;

    public static fromSessionBean(sb: SessionBean): Session {
        let session = new Session();
        console.log(IMAccount.getUID(), sb.Uid1, sb.Uid2, sb.Uid1 === IMAccount.getUID());
        if (sb.Uid1 === IMAccount.getUID()) {
            session.To = sb.Uid2;
        } else {
            session.To = sb.Uid1;
        }

        session.ID = session.getSID();
        session.Title = session.ID;
        session.UpdateAt = sb.UpdateAt.toString();
        session.LastMessageSender = "-";
        session.LastMessage = '-';
        session.UnreadCount = 0;
        return session;
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

    public sendMessage(message: ChatMessage) {

    }

    public getMessages(): ChatMessage[] {
        return [];
    }

    public GetLastMessage(): string {
        return this.LastMessage;
    }

    private getSID(): string {

        let lg = IMAccount.getUID();
        let sm = this.To;

        if (lg < sm) {
            let tmp = lg;
            lg = sm;
            sm = tmp;
        }

        return lg + "_" + sm;
    }
}
