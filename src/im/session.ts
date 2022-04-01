import { map, mergeMap, Observable } from "rxjs";
import { Api } from "../api/api";
import { SessionBean } from "../api/model";
import { Account } from "./account";
import { ChatMessage } from "./chat_message";
import { Message, MessageType } from "./message";
import { Ws } from "./ws";

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

    private messages = new Map<string, ChatMessage>();

    public static fromSessionBean(sb: SessionBean): Session {
        let session = new Session();
        console.log(Account.getInstance().getUID(), sb.Uid1, sb.Uid2, sb.Uid1 === Account.getInstance().getUID());
        if (sb.Uid1 === Account.getInstance().getUID()) {
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

    public sendTextMessage(msg: string): Observable<Message> {
        return this.send(msg, MessageType.Text)
            .pipe(

            )
    }

    public setUpdateListener(listener: (session: Session) => void) {

    }

    public setMessageListener(listener: (message: ChatMessage) => void) {

    }

    public sendMessage(message: ChatMessage) {

    }

    public getMessages(): ChatMessage[] {
        return Array.from(this.messages.values());
    }

    public GetLastMessage(): string {
        return this.LastMessage;
    }

    private getSID(): string {

        let lg = Account.getInstance().getUID();
        let sm = this.To;

        if (lg < sm) {
            let tmp = lg;
            lg = sm;
            sm = tmp;
        }

        return lg + "_" + sm;
    }

    private send(content: string, type: number): Observable<Message> {
        const time = new Date().getSeconds();

        const m: Message = {
            Content: content,
            From: Account.getInstance().getUID(),
            Mid: 0,
            SendAt: time,
            Seq: 0,
            To: this.To,
            Type: type
        }

        return Api.getMid()
            .pipe(
                map(resp => {
                    m.Mid = resp.Mid;
                    return m
                })
            )
            .pipe(
                mergeMap(msg =>
                    Ws.sendChatMessage(msg)
                )
            )
            .pipe(
                
            )
    }
}
