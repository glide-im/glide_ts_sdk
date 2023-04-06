import { delay, first, map, mergeMap, Observable, of, throwError, toArray } from "rxjs";
import { onNext } from "src/rx/next";
import { timeStampSecToDate } from "src/utils/TimeUtils";
import { Api } from "../api/api";
import { SessionBean } from "../api/model";
import { Account } from "./account";
import { ChatMessage, SendingStatus } from "./chat_message";
import { IMUserInfo } from "./def";
import { Cache } from "./cache";
import { Actions, CliCustomMessage, Message, MessageType } from "./message";
import { Ws } from "./ws";
import { makeStyles } from "@mui/material";

enum SessionType {
    Single = 1,
    Group = 2
}

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
    public UnreadCount: number = 0;
    public Type: number;
    public To: string;

    private userInfo: IMUserInfo | null = null;

    private messageList = new Array<ChatMessage>();
    private messageMap = new Map<string, ChatMessage>();

    private messageListener: ((message: ChatMessage) => void) | null = null;
    private sessionUpdateListener: SessionUpdateListener | null = null;

    public static create(to: string, type: number): Session {
        const ret = new Session();
        ret.To = to;
        ret.Type = type;
        ret.ID = ret.getSID();
        ret.Title = ret.ID;
        if (type === 1) {
            ret.Title = Cache.getUserInfo(to)?.name ?? ret.ID;
        }
        return ret;
    }

    public static fromSessionBean(sb: SessionBean): Session {
        let session = new Session();
        session.To = sb.To.toString();
        session.ID = session.getSID();
        session.Title = session.ID;
        session.UpdateAt = sb.UpdateAt.toString();
        session.LastMessageSender = "-";
        session.LastMessage = '-';
        session.UnreadCount = 0;
        session.Type = SessionType.Single;
        return session;
    }

    public clearUnread() {
        this.UnreadCount = 0;
        this.sessionUpdateListener?.();
    }

    public init(): Observable<Session> {
        console.log('Session', 'init...')
        if (this.isGroup()) {
            this.Avatar = Cache.getChannelInfo(this.To)?.avatar ?? ""
            this.Title = Cache.getChannelInfo(this.To)?.name ?? ''
            if (this.To == "the_world_channel") {
                of("Hi, 我来了").pipe(
                    delay(2000),
                    mergeMap(msg => this.sendTextMessage(msg)),
                ).subscribe(msg => {

                })
            }
            return of(this);
        } else {
            return Cache.loadUserInfo1(this.To)
                .pipe(
                    delay(500),
                    onNext(info => {
                        this.userInfo = info;
                        this.Title = info.name;
                        this.Avatar = info.avatar;
                        console.log('Session', 'info updated', info)
                        this.sessionUpdateListener?.()
                    }),
                    // mergeMap(() => this.getMessageHistry(0)),
                    mergeMap(() => of(this)),
                    first(),
                );
        }
    }

    public isGroup(): boolean {
        return this.Type === SessionType.Group;
    }

    public getUserInfo(): IMUserInfo | null {
        return this.userInfo;
    }

    public getMessageHistory(beforeMid: number): Observable<ChatMessage[]> {

        if (beforeMid === 0 && this.messageList.length !== 0) {
            beforeMid = Number.MAX_SAFE_INTEGER;
        }

        const res = this.getMessageBeforeMid(beforeMid);
        // if (res.length !== 0) {
        return of(res);
        // }


        switch (this.Type) {
            case SessionType.Single:
                return Api.getMessageHistry(this.To, beforeMid)
                    .pipe(
                        mergeMap(resp => of(...resp)),
                        map(msg => ChatMessage.create2(msg, this.Type)),
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



    public onMessage(action: string, message: Message) {
        const c = ChatMessage.create(message)
        const mid = c.getId();
        console.log("Session", "onMessage", mid, this.getSID(), message.type, message.content);
        if (action == Actions.MessageCli && this.messageMap.has(mid)) {
            this.messageMap.get(mid).update2(message)
            return;
        }
        Cache.cacheUserInfo(message.from).then(() => {
            this.addMessageByOrder(c);
        })
    }

    public sendTextMessage(msg: string): Observable<ChatMessage> {
        return this.send(msg, MessageType.Text);
    }

    public sendImageMessage(img: string): Observable<ChatMessage> {
        return this.send(img, MessageType.Image)
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
        if (message.From !== Account.getInstance().getUID() && Account.getInstance().getSessionList().currentSession !== this.ID) {
            this.UnreadCount++;
        }
        if (this.messageMap.has(message.getId())) {
            this.messageMap.get(message.getId()).update(message);
        } else {
            let index = this.messageList.findIndex(msg => msg.OrderKey > message.OrderKey);
            this.messageMap.set(message.getId(), message);
            if (index === -1) {
                this.messageList.push(message);
            } else {
                this.messageList.splice(index, 0, message);
            }
            this.messageListener?.(message)
        }

        if (this.messageList.length > 0 && this.messageList[this.messageList.length - 1].getId() === message.getId()) {
            console.log("Session", "update session last message", this.getSID(), message.getDisplayContent());
            this.LastMessage = message.getDisplayContent();
            if (this.Type === 2) {
                this.LastMessageSender = message.From
            } else {
                this.LastMessageSender = message.From === Account.getInstance().getUID() ? "我" : this.Title;
            }
            this.UpdateAt = timeStampSecToDate(message.SendAt);
        }
        if (!this.sessionUpdateListener) {
            console.log("Session", "sessionUpdateListener is null")
        }
        this.sessionUpdateListener?.();
    }

    private getSID(): string {
        if (this.Type === 2) {
            return this.To;
        }

        let lg = Account.getInstance().getUID();
        let sm = this.To;

        if (lg < sm) {
            let tmp = lg;
            lg = sm;
            sm = tmp;
        }
        return lg + "_" + sm;
    }

    public send(content: string, type: number): Observable<ChatMessage> {
        const time = Date.now();
        const from = Account.getInstance().getUID();
        const m: Message = {
            cliMid: uuid(32, 16),
            content: content,
            from: from,
            mid: 0,
            sendAt: time,
            seq: 0,
            to: this.To,
            type: type,
            status: 0,
        };
        const r = ChatMessage.create(m);
        r.Sending = SendingStatus.Sending;

        this.addMessageByOrder(r);

        return Ws.sendMessage(this.Type, m).pipe(
            map(resp => {
                const r = ChatMessage.create(resp);
                r.Sending = SendingStatus.Sent;
                this.addMessageByOrder(r);
                return r;
            })
        );
    }
}

export function getSID(type: number, to: string): string {
    if (type === 2) {
        return to;
    }

    let lg = Account.getInstance().getUID();
    let sm = to;

    if (lg < sm) {
        let tmp = lg;
        lg = sm;
        sm = tmp;
    }
    return lg + "_" + sm;
}


function uuid(len, radix) {
    var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');
    var uuid = [], i;
    radix = radix || chars.length;

    if (len) {
        // Compact form
        for (i = 0; i < len; i++) uuid[i] = chars[0 | Math.random() * radix];
    } else {
        // rfc4122, version 4 form
        var r;

        // rfc4122 requires these characters
        uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
        uuid[14] = '4';

        // Fill in random data.  At i==19 set the high bits of clock sequence as
        // per rfc4122, sec. 4.1.5
        for (i = 0; i < 36; i++) {
            if (!uuid[i]) {
                r = 0 | Math.random() * 16;
                uuid[i] = chars[(i === 19) ? (r & 0x3) | 0x8 : r];
            }
        }
    }

    return uuid.join('');
}