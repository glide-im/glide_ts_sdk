import {
    catchError,
    from,
    groupBy,
    map,
    mergeMap,
    Observable,
    of,
    tap,
    toArray,
} from 'rxjs';
import { Api } from '../api/api';
import { GlideBaseInfo } from './def';
import { UserInfoBean } from '../api/model';
import { getCookie, setCookie } from '../utils/Cookies';
import { SessionListCache } from './session_list';
import { ChatMessageCache, MessageBaseInfo } from './chat_message';
import { SessionBaseInfo } from './session';
import { MessageStatus } from './message';
import { ChatMessageDbCache, GlideDb, SessionDbCache } from './db';
import { Logger } from '../utils/Logger';

export class GlideCache implements SessionListCache, ChatMessageCache {
    private _db: GlideDb = new GlideDb();

    private _sessionDbCache: SessionListCache;
    private _messageDbCache: ChatMessageCache;

    init(uid: string): Observable<string> {
        this._sessionDbCache = new SessionDbCache(this._db);
        this._messageDbCache = new ChatMessageDbCache(this._db);
        return this._db.init(uid);
    }

    addMessage(message: MessageBaseInfo): Observable<void> {
        return this._messageDbCache.addMessage(message);
    }

    addMessages(messages: MessageBaseInfo[]): Observable<void> {
        return this._messageDbCache.addMessages(messages);
    }

    clearAllSession(): Observable<void> {
        return this._sessionDbCache.clearAllSession();
    }

    containSession(sid: string): Observable<boolean> {
        return this._sessionDbCache.containSession(sid);
    }

    deleteMessage(cliId: string): Observable<void> {
        return this._messageDbCache.deleteMessage(cliId);
    }

    deleteMessageBySid(sid: string): Observable<void> {
        return this._messageDbCache.deleteMessageBySid(sid);
    }

    getSession(sid: string): Observable<SessionBaseInfo | null> {
        return this._sessionDbCache.getSession(sid);
    }

    getAllSession(): Observable<SessionBaseInfo[]> {
        return this._sessionDbCache.getAllSession();
    }

    getMessageByCliId(cliId: string): Observable<MessageBaseInfo | null> {
        return this._messageDbCache.getMessageByCliId(cliId);
    }

    getMessageByMid(mid: number): Observable<MessageBaseInfo | null> {
        return this._messageDbCache.getMessageByMid(mid);
    }

    getLatestSessionMessage(sid: string): Observable<MessageBaseInfo | null> {
        return this._messageDbCache.getLatestSessionMessage(sid);
    }

    getSessionMessageBySeq(
        sid: string,
        beforeSeq: number
    ): Observable<MessageBaseInfo | null> {
        return this._messageDbCache.getSessionMessageBySeq(sid, beforeSeq);
    }

    getSessionMessagesByTime(
        sid: string,
        beforeTime: number
    ): Observable<MessageBaseInfo[]> {
        return this._messageDbCache.getSessionMessagesByTime(sid, beforeTime);
    }

    removeSession(sid: string): Observable<void> {
        return this._sessionDbCache.removeSession(sid);
    }

    setSession(info: SessionBaseInfo): Observable<void> {
        return this._sessionDbCache.setSession(info);
    }

    sessionCount(): Observable<number> {
        return this._sessionDbCache.sessionCount();
    }

    updateMessage(message: MessageBaseInfo): Observable<void> {
        return this._messageDbCache.updateMessage(message);
    }

    updateMessageStatus(
        cliId: number,
        status: MessageStatus
    ): Observable<void> {
        return this._messageDbCache.updateMessageStatus(cliId, status);
    }
}

class BaseInfoCache {
    private tempCache = new Map<string, GlideBaseInfo>();

    constructor() {
        this.tempCache.set('system', {
            avatar: 'https://im.dengzii.com/system.png',
            name: '系统',
            isChannel: false,
            id: 'system',
        });
        this.tempCache.set('the_world_channel', {
            avatar: 'https://im.dengzii.com/world_channel.png',
            id: 'the_world_channel',
            isChannel: true,
            name: '世界频道',
        });
    }

    public getToken(): string {
        return getCookie('token');
    }

    public storeToken(token: string) {
        setCookie('token', token, 7);
    }

    public getUserInfo(id: string): GlideBaseInfo | null {
        let i = this.tempCache.get(id);
        if (i !== null && i !== undefined) {
            return i;
        }
        const res = BaseInfoCache._readObject(`user_${id}`);
        if (res !== null) {
            this.tempCache.set(id, res);
            Logger.log('Cache', 'restore cache user info', res);
            return res;
        }
        return null;
    }

    public getChannelInfo(id: string): GlideBaseInfo | null {
        if (id === 'the_world_channel') {
            return {
                avatar: 'https://im.dengzii.com/world_channel.png',
                id: id,
                isChannel: true,
                name: '世界频道',
            };
        }
        return { avatar: '', id: id, isChannel: true, name: id };
    }

    public loadUserInfo1(id: string): Observable<GlideBaseInfo> {
        const ci = this.getUserInfo(id);
        if (ci !== null) {
            return of(ci);
        }

        return from(Api.getUserInfo(id)).pipe(
            map((r) => r[0]),
            map<UserInfoBean, GlideBaseInfo>((us, i) => {
                if (!us) {
                    return {
                        avatar:
                            'https://api.dicebear.com/6.x/adventurer/svg?seed=' +
                            id,
                        name: id,
                        id: id,
                    } as GlideBaseInfo;
                }
                const m = {
                    avatar: us.avatar,
                    name: us.nick_name,
                    id: us.uid.toString(),
                } as GlideBaseInfo;
                BaseInfoCache._writeObject(`user_${id}`, m);
                this.tempCache.set(m.id, m);
                return m;
            }),
            catchError((e) => {
                Logger.error('Cache', 'load user info failed', e);
                return of({
                    avatar: '',
                    name: id,
                    id: id,
                } as GlideBaseInfo);
            })
        );
    }

    public loadUserInfo(...id: string[]): Observable<GlideBaseInfo[]> {
        return of(...id).pipe(
            groupBy<string, boolean>((id) => {
                return this.getUserInfo(id) != null;
            }),
            mergeMap((g) => {
                if (g.key) {
                    return g.pipe(map((id) => this.getUserInfo(id)));
                } else {
                    return g.pipe(
                        toArray(),
                        mergeMap((ids) => {
                            return Api.getUserInfo(...ids);
                        }),
                        mergeMap((userInfos) => of(...userInfos)),
                        map<UserInfoBean, GlideBaseInfo>((u) => ({
                            avatar: u.avatar,
                            name: u.nick_name,
                            id: u.uid.toString(),
                            isChannel: false,
                        }))
                    );
                }
            }),
            toArray(),
            tap((userInfo) => {
                userInfo.forEach((u) => {
                    BaseInfoCache._writeObject(`ui_${id}`, u);
                    this.tempCache.set(u.id, u);
                });
            })
        );
    }

    public clean() {
        // this.tempCache.clear();
        // TODO fix
        localStorage.clear();
    }

    static _readObject(key: string): any | null {
        const val = localStorage.getItem(key);
        if (val === null && val === '') {
            return null;
        }
        //console.log('[cache]', "read cache", key, val)
        return JSON.parse(val);
    }

    static _writeObject(key: string, val: any): void {
        //console.log('[cache]', "write cache", key, val)
        localStorage.setItem(key, JSON.stringify(val));
    }
}

export const Cache = new BaseInfoCache();
