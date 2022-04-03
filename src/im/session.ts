import { every, map, mergeMap, Observable, share } from "rxjs";
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

    private messages = new Map<number, Message>();
    private messageListener: ((message: Message) => void) | null = null;

    public static fromSessionBean(sb: SessionBean): Session {
        let session = new Session();
        session.To = sb.To;
        session.ID = session.getSID();
        session.Title = session.ID;
        session.UpdateAt = sb.UpdateAt.toString();
        session.LastMessageSender = "-";
        session.LastMessage = '-';
        session.UnreadCount = 0;
        return session;
    }

    public onMessage(message: Message) {
        console.log("onMessage", message);
        this.messages.set(message.mid, message)
        this.messageListener && this.messageListener(message);
    }

    public sendTextMessage(msg: string): Observable<Message> {
        return this.send(msg, MessageType.Text);
    }

    public setUpdateListener(listener: (session: Session) => void) {

    }

    public setMessageListener(listener: (message: Message) => void) {
        this.messageListener = listener;
    }

    public sendMessage(message: ChatMessage) {

    }

    public getMessages(): Message[] {
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
            content: content,
            from: Account.getInstance().getUID(),
            mid: 0,
            sendAt: time,
            seq: 0,
            to: this.To,
            type: type
        }

        return Api.getMid()
            .pipe(
                map(resp => {
                    m.mid = resp.Mid;
                    return m
                })
            )
            .pipe(
                mergeMap(msg =>
                    Ws.sendChatMessage(msg)
                )
            )
    }
}
