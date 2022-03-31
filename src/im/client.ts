import {State, Ws} from "./ws";
import {
    ActionChatMessage,
    ActionFailed,
    ActionGroupAddMember,
    ActionGroupCreate,
    ActionGroupInfo,
    ActionGroupMessage,
    ActionGroupUpdate,
    ActionNotify,
    ActionOnlineUser,
    ActionUserAddFriend,
    ActionUserGetInfo,
    ActionUserLogin,
    ActionUserNewChat,
    ActionUserUnauthorized,
    AddGroup,
    AuthResponse,
    GroupAddMember,
    Message,
    UserInfo
} from "./message";
import {Group} from "./group";
import {delCookie, getCookie, setCookie} from "../utils/Cookies";

export enum MessageLevel {
    LevelDefault,
    LevelInfo,
    LevelError,
    LevelSuccess,
    LevelWarning
}

export type MessageListener = (level: MessageLevel, msg: string) => void

class Account {
    private uid_: string;
    private token_: string;

    constructor() {
        this.uid_ = getCookie("uid") ?? "";
        this.token_ = getCookie("token") ?? "";
    }

    public setAuth(uid: number, token: string) {
        this.uid_ = uid.toString();
        this.token_ = token;
        setCookie("uid", uid.toString(), 1);
        setCookie("token", token, 1);
    }

    public clearAuth() {
        this.uid_ = "";
        this.token_ = "";
        delCookie("uid");
        delCookie("token");
    }

    public isAuthenticated(): boolean {
        return this.uid_ && this.uid_ !== "" && this.token_ && this.token_ !== "";
    }

    public getUID(): number {
        return parseInt(this.uid_);
    }

    public getToken(): string {
        return this.token_;
    }
}

export const IMAccount = new Account();

class Client {

    public uid = -1;
    public messageListener: MessageListener;

    private token = "";
    private device = 2;
    private userInfo = new Map<number, UserInfo>();
    private groupInfo = new Map<number, Group>();
    private userStateListener: (loggedIn: boolean) => void | null = null;
    private toaster: (msg: string) => void | null = null;


    public auth() {

    }

    public login(account: string, password: string): Promise<AuthResponse> {
        console.log("client/login", account, password);
        let m = {Account: account, Password: password, Device: this.device};
        this.uid = -1;
        return Ws.request<AuthResponse>(ActionUserLogin, m)
            .catch(reason => {
                this.showMessage(MessageLevel.LevelError, `Login Failed, Reason: ${reason}`);
                return Promise.reject("Login Failed")
            })
            .then(value => {
                this.uid = value.Uid;
                this.token = value.Token;
                Ws.setMessageListener(msg => {
                    this.onMessage(msg)
                });
                return value
            })
            .then(value => {
                return this.getUserInfo([this.uid]).then(() => value)
            })
            .then(value => {
                if (this.userStateListener) {
                    this.userStateListener(true)
                }
                this.showMessage(MessageLevel.LevelSuccess, `Login Success: Uid=${this.uid}`);
                return value
            })
            .finally(() => {
                console.log("client/login", "complete")
            })
    }


    public createGroup(name: string): Promise<AddGroup> {
        console.log("client/createGroup", name);
        return Ws.request<AddGroup>(ActionGroupCreate, {Name: name})
            .then(value => {
                console.log("client/createGroup", value);
                return Promise.resolve(value)
            })
            .finally(() => {
                console.log("client/createGroup", "complete")
            })
    }

    public getAllOnlineUser(callback: (ret: UserInfo[]) => void) {
        Ws.request<UserInfo[]>(ActionOnlineUser)
            .then(u => {
                u.forEach((v) => {
                    this.userInfo.set(v.Uid, v)
                });
                callback(u)
            })

    }

    public getGroupInfo(gid: number[], update = false, memberInfo = true): Promise<Group[]> {
        console.log("client/getGroupInfo", gid, update);
        const ids = update ? gid : gid.filter(value => {
            return !this.groupInfo.has(value)
        });
        if (ids.length === 0) {
            return Promise.resolve([])
        }
        return Ws.request<Group[]>(ActionGroupInfo, {Gid: gid})
            .then(value => {
                let allMembers: number[] = [];
                for (let group of value) {
                    this.groupInfo.set(group.Gid, group);
                    allMembers = allMembers.concat(group.Members.map(m => m.Uid))
                }
                return this.getUserInfo(allMembers).then(() => {

                    return value
                })
            })

            .finally(() => {
                console.log("client/getGroupInfo", "completed!")
            })
    }

    public getUserInfo(uid: number[], update: boolean = false): Promise<UserInfo[]> {
        console.log("client/getUserInfo", uid, update);
        const ids = update ? uid : uid.filter(value => {
            return !this.userInfo.has(value)
        });
        if (ids.length === 0) {
            return Promise.resolve([])
        }
        return Ws.request<UserInfo[]>(ActionUserGetInfo, {Uid: ids})
            .then(value => {
                for (let userInfo of value) {
                    this.userInfo.set(userInfo.Uid, userInfo)
                }
                return Promise.resolve(value)
            })
            .finally(() => {
                console.log("client/getUserInfo", "completed!")
            })
    }

    public getCachedUserInfo(id: number): UserInfo | null {
        if (this.userInfo.has(id)) {
            return this.userInfo.get(id)
        }
        return null
    }

    public setToaster(t: (toast: string) => void) {
        this.toaster = t
    }

    public getGroup(gid: number): Group | null {
        if (this.groupInfo.has(gid)) {
            return this.groupInfo.get(gid)
        }
        return null
    }

    public showToast(msg: string) {
        this.toaster(msg)
    }

    public catchPromiseReject(reason: string): Promise<any> {
        if (this.toaster) {
            this.toaster(reason)
        }
        return Promise.reject(reason)
    }

    public showMessage(level: MessageLevel, msg: string) {
        if (this.messageListener) {
            this.messageListener(level, msg)
        }
    }

    private onMessage(msg: Message) {
        if (msg.Action === ActionFailed) {
            this.showMessage(MessageLevel.LevelError, msg.Data);
            return
        } else if (msg.Action === ActionUserUnauthorized) {
            this.showMessage(MessageLevel.LevelError, msg.Data);
            return
        } else if (msg.Action === ActionNotify) {
            this.showMessage(MessageLevel.LevelError, msg.Data);
            return
        }

        const data = JSON.parse(msg.Data);
        switch (msg.Action) {
            case ActionChatMessage:
                // this.chatList.onChatMessage(ChatMessage.create(data));
                break;
            case ActionGroupMessage:
                break;
            case ActionUserAddFriend:
                //this.contactsList.onNewContacts(data);
                break;
            case ActionGroupAddMember:
                const r: GroupAddMember = data;
                // const group = this.contactsList.getGroup(r.Gid);
                // group.onNewMember(r.Members);
                break;
            case ActionUserNewChat:
                // this.chatList.add(OldSession.create(data));
                break;
            case ActionGroupUpdate:
                break
        }
    }

    private onWsStateChanged(state: State, msg: string) {
        if (state === State.CLOSED) {
            if (this.userStateListener) {
                this.userStateListener(false)
            }
            this.uid = -1;
        }
    }
}

export const client = new Client();




