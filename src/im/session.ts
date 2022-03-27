import {SessionBean} from "../api/model";

export class Session {

    public ID: string;
    public Avatar: string;
    public Title: string;
    public UpdateAt: string;
    public LastMessageSender: string;
    public LastMessage: string;
    public UnreadCount: number;

    constructor() {

    }

    public setUpdateListener(listener: (session: Session) => void) {

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