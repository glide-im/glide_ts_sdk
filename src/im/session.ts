import { map, mergeMap, Observable, of, throwError, toArray } from "rxjs";
import { onNext } from "src/rx/next";
import { Api } from "../api/api";
import { SessionBean } from "../api/model";
import { Account } from "./account";
import { ChatMessage, MessageStatus } from "./chat_message";
import { Message, MessageType, SessionType } from "./message";
import { Ws } from "./ws";

export interface SessionUpdateListener {
    (): void
}

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

    private messageList = new Array<ChatMessage>();
    private messageMap = new Map<number, ChatMessage>();

    private messageListener: ((message: ChatMessage) => void) | null = null;
    private sessionUpdateListener: SessionUpdateListener | null = null;

    public static fromSessionBean(sb: SessionBean): Session {
        let session = new Session();
        session.To = sb.To;
        session.ID = session.getSID();
        session.Title = session.ID;
        session.UpdateAt = sb.UpdateAt.toString();
        session.LastMessageSender = "-";
        session.LastMessage = '-';
        session.UnreadCount = 0;
        session.Type = SessionType.Single;
        return session;
    }

    public getMessageHistry(beforeMid: number): Observable<ChatMessage[]> {
        const res = this.getMessageBeforeMid(beforeMid);
        if (res.length !== 0) {
            return of(res);
        }

        switch (this.Type) {
            case SessionType.Single:
                return Api.getMessageHistry(this.To, beforeMid)
                    .pipe(
                        mergeMap(resp => of(...resp)),
                        map(msg => ChatMessage.create2(msg)),
                        onNext(msg => this.addMessageByOrder(msg)),
                        toArray(),
                    )
            case SessionType.Group:
                return of();
            default:
                return throwError(() => new Error("unknown session type"));
        }
    }

    public onMessage(message: Message) {
        console.log("onMessage", message);

        const c = ChatMessage.create(message)
        this.addMessageByOrder(c);
    }

    public sendTextMessage(msg: string): Observable<Message> {
        return this.send(msg, MessageType.Text);
    }

    public setSessionUpdateListener(listener: SessionUpdateListener | null) {
        this.sessionUpdateListener = listener;
    }

    public setMessageListener(listener: (message: ChatMessage) => void) {
        this.messageListener = listener;
    }

    public getMessages(): ChatMessage[] {
        return Array.from(this.messageMap.values());
    }

    private getMessageBeforeMid(mid: number): ChatMessage[] {
        if (this.messageList.length === 0) {
            return this.messageList;
        }

        let index = 0;
        if (mid !== 0) {
            index = this.messageList.findIndex(msg => msg.Mid === mid);
            if (index === -1) {
                return [];
            }
        }
        return this.messageList.splice(index, this.messageList.length - index);
    }

    private addMessageByOrder(message: ChatMessage) {
        if (this.messageMap.has(message.Mid)) {
            this.messageMap.get(message.Mid).update(message);

        } else {
            let index = this.messageList.findIndex(msg => msg.Mid > message.Mid);
            if (index === -1) {
                this.messageMap.set(message.Mid, message);
                this.messageList.push(message);
            } else {
                this.messageMap.set(message.Mid, message);
                this.messageList.splice(index, 0, message);
            }
            this.messageListener && this.messageListener(message);
        }
        this.sessionUpdateListener && this.sessionUpdateListener();
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

        return Api.getMid()
            .pipe(
                map(resp => {
                    const time = new Date().getSeconds();
                    return {
                        content: content,
                        from: Account.getInstance().getUID(),
                        mid: resp.Mid,
                        sendAt: time,
                        seq: 0,
                        to: this.To,
                        type: type
                    }
                }),
                onNext(msg => {
                    this.addMessageByOrder(ChatMessage.create(msg));
                }),
                mergeMap(msg =>
                    Ws.sendChatMessage(msg)
                ),
                onNext(msg => {
                    const r = ChatMessage.create(msg);
                    r.Status = MessageStatus.Sent;
                    this.addMessageByOrder(r);
                }),
            )
    }
}

class SortedList<T, V> {

    private list = new Array<T>();
    private map = new Map<V, T>();

    constructor() {

    }


    public add() {

    }

}