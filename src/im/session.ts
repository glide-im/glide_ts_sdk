import { map, mergeMap, Observable, of, throwError, toArray } from "rxjs";
import { onNext } from "src/rx/next";
import { timeStampSecToDate } from "src/utils/TimeUtils";
import { Api } from "../api/api";
import { SessionBean } from "../api/model";
import { Account } from "./account";
import { ChatMessage, SendingStatus } from "./chat_message";
import { IMUserInfo } from "./def";
import { Glide } from "./glide";
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

    private userInfo: IMUserInfo | null = null;

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

    public init(): Observable<Session> {
        if (this.isGroup()) {
            return of(this);
        } else {
            return Glide.loadUserInfo(this.To)
                .pipe(
                    mergeMap(userInfo => of(userInfo[0])),
                    // onErrorResumeNext(new Observable<IMUserInfo>(subscriber => {
                    //     subscriber.next({
                    //         avatar: "-",
                    //         name: "-",
                    //         uid: this.To,
                    //     });
                    //     subscriber.complete();
                    // })),
                    onNext(info => {
                        this.userInfo = info;
                        this.Title = info.name;
                        this.Avatar = info.avatar;
                    }),
                    mergeMap(() => this.getMessageHistry(0)),
                    mergeMap(() => of(this)),
                );
        }
    }

    public isGroup(): boolean {
        return this.Type === SessionType.Group;
    }

    public getUserInfo(): IMUserInfo | null {
        return this.userInfo;
    }

    public getMessageHistry(beforeMid: number): Observable<ChatMessage[]> {
        if (beforeMid === 0 && this.messageList.length !== 0) {
            beforeMid = Number.MAX_SAFE_INTEGER;
        }

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
                        onNext(msg => {
                            this.addMessageByOrder(msg)
                        }),
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

        this.UnreadCount++;
        this.addMessageByOrder(c);
    }

    public sendTextMessage(msg: string): Observable<ChatMessage> {
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
            return [];
        }

        let index = 0;
        if (mid !== 0) {
            index = this.messageList.findIndex(msg => msg.Mid <= mid);
            if (index === -1) {
                return [];
            }
        }

        return this.messageList.slice(index, this.messageList.length - index);
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

        if (this.messageList[this.messageList.length - 1] === message) {
            this.LastMessage = message.Content;
            this.LastMessageSender = message.From === Account.getInstance().getUID() ? "me" : this.Title;
            this.UpdateAt = timeStampSecToDate(message.SendAt);
            this.sessionUpdateListener?.();
        }
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

    private send(content: string, type: number): Observable<ChatMessage> {

        return Api.getMid()
            .pipe(
                map(resp => {
                    const time = Date.parse(new Date().toString()) / 1000;
                    return {
                        content: content,
                        from: Account.getInstance().getUID(),
                        mid: resp.Mid,
                        sendAt: time,
                        seq: 0,
                        to: this.To,
                        type: type,
                        status: 0,
                    }
                }),
                onNext(msg => {
                    const r = ChatMessage.create(msg);
                    r.Sending = SendingStatus.Sending;
                    this.addMessageByOrder(r);
                }),
                mergeMap(msg =>
                    Ws.sendChatMessage(msg)
                ),
                map(resp => {
                    const r = ChatMessage.create(resp);
                    r.Sending = SendingStatus.Sent;
                    this.addMessageByOrder(r);
                    return r;
                }),
            )
    }
}