import {State, Ws} from "./ws";
import {
    ActionChatMessage,
    ActionGroupAddMember,
    ActionGroupCreate,
    ActionGroupInfo,
    ActionGroupJoin,
    ActionGroupMessage,
    ActionGroupUpdate,
    ActionOnlineUser,
    ActionUserGetInfo,
    ActionUserLogin,
    ActionUserNewChat,
    ActionUserRegister,
    AuthResponse,
    GroupAddMember,
    IChatMessage,
    IContacts,
    IGroup,
    Message,
    RespActionFriendApproval,
    UserInfo
} from "./message";
import {Chat, ChatMessage} from "./chat";
import {ChatList} from "./ChatList";
import {Group} from "./group";
import {ContactsList} from "./contactsList";

type ContactChangeListener = (u: IContacts[]) => void | null

class Client {

    public chatList = new ChatList()
    public contactsList = new ContactsList()
    messageListener: (msg: Message) => void | null = null
    private userInfo = new Map<number, UserInfo>()
    private groupInfo = new Map<number, Group>()
    private uid = -1
    private userStateListener: (loggedIn: boolean) => void | null = null
    private contactChangeListener: ContactChangeListener = null
    private toaster: (msg: string) => void | null = null

    constructor() {
        Ws.addStateListener((a, b) => {
            this.onWsStateChanged(a, b)
        })
    }

    public getMyUid(): number {
        return this.uid
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

    public setContactChangeListener(l: ContactChangeListener | null) {
        this.contactChangeListener = l
    }

    public onUserStateChange(l: (loggedIn: boolean) => void) {
        this.userStateListener = l
    }

    public login(account: string, password: string): Promise<AuthResponse> {
        console.log("client/login", account, password)
        let m = {Account: account, Password: password}
        this.chatList.clear()
        this.contactsList.clear()
        this.uid = -1
        return Ws.request<AuthResponse>(ActionUserLogin, m)
            .then(value => {
                this.uid = value.Uid
                this.onAuthed()
                return this.contactsList.updateAll()
                    .then(() => Promise.allSettled([this.updateChatList(), this.getUserInfo([this.uid])]))
                    .then(() => {
                        if (this.userStateListener != null) {
                            this.userStateListener(true)
                        }
                        return Promise.resolve(value)
                    })
            })
            .catch(reason => this.catchPromiseReject(reason))
            .finally(() => {
                console.log("client/login", "complete")
            })
    }

    public joinGroup(gid: number): Promise<Chat> {
        console.log("client/joinGroup", gid)
        return Ws.request<Chat>(ActionGroupJoin, {Gid: gid})
            .then(value => {
                this.chatList.add(Chat.create(value))
            })
            .catch(reason => this.catchPromiseReject(reason))
            .finally(() => {
                console.log("client/joinGroup", "completed!")
                this.contactsList.updateAll().then()
                this.chatList.update()
            })
    }

    public createGroup(name: string): Promise<IGroup> {
        console.log("client/createGroup", name)
        return Ws.request<IGroup>(ActionGroupCreate, {Name: name})
            .then(value => {
                this.contactsList.updateAll().then()
                this.updateChatList().then()
                console.log("client/createGroup", value)
                return Promise.resolve(value)
            })
            .catch(reason => this.catchPromiseReject(reason))
            .finally(() => {
                console.log("client/createGroup", "complete")
            })
    }

    public register(account: string, password: string): Promise<any> {
        return Ws.request<any>(ActionUserRegister, {Account: account, Password: password})
    }

    public getAllOnlineUser(callback: (ret: UserInfo[]) => void) {
        Ws.request<UserInfo[]>(ActionOnlineUser)
            .then(u => {
                u.forEach((v) => {
                    this.userInfo.set(v.Uid, v)
                })
                callback(u)
            })
            .catch(reason => this.catchPromiseReject(reason))
    }


    public getChatTitle(id: number, type: number): string {
        let ret = "*"
        if (type === 1) {
            if (!this.userInfo.has(id)) {
                ret = "--"
            } else {
                ret = this.userInfo.get(id).Nickname
                if (ret.length === 0) {
                    ret = this.userInfo.get(id).Account
                }
            }
        } else if (type === 2) {
            if (!this.groupInfo.has(id)) {
                ret = "--"
            } else {
                ret = this.groupInfo.get(id).Name
            }
        }
        if (ret.length === 0) {
            return `${id}-${type}`
        }
        return ret
    }

    public getCachedUserInfo(id: number): UserInfo | null {
        if (this.userInfo.has(id)) {
            return this.userInfo.get(id)
        }
        return null
    }

    public updateChatList(): Promise<Chat[]> {
        console.log("client/updateChatList")
        return this.chatList.asyncUpdate()
            .catch(reason => this.catchPromiseReject(reason))
            .finally(() => {
                console.log("client/updateChatList", "completed!")
            })
    }

    public showToast(msg: string) {
        this.toaster(msg)
    }

    public getGroupInfo(gid: number[], update = false, memberInfo = true): Promise<Group[]> {
        console.log("client/getGroupInfo", gid, update)
        const ids = update ? gid : gid.filter(value => {
            return !this.groupInfo.has(value)
        })
        if (ids.length === 0) {
            return Promise.resolve([])
        }
        return Ws.request<Group[]>(ActionGroupInfo, {Gid: gid})
            .then(value => {
                let allMembers: number[] = []
                for (let group of value) {
                    this.groupInfo.set(group.Gid, group)
                    allMembers = allMembers.concat(group.Members.map(m => m.Uid))
                }
                return this.getUserInfo(allMembers).then(() => {

                    return value
                })
            })
            .catch(reason => this.catchPromiseReject(reason))
            .finally(() => {
                console.log("client/getGroupInfo", "completed!")
            })
    }

    public getUserInfo(uid: number[], update: boolean = false): Promise<UserInfo[]> {
        console.log("client/getUserInfo", uid, update)
        const ids = update ? uid : uid.filter(value => {
            return !this.userInfo.has(value)
        })
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
            .catch(reason => this.catchPromiseReject(reason))
            .finally(() => {
                console.log("client/getUserInfo", "completed!")
            })
    }

    public catchPromiseReject(reason: string): Promise<any> {
        if (this.toaster) {
            this.toaster(reason)
        }
        return Promise.reject(reason)
    }

    private onAuthed() {
        Ws.addMessageListener(msg => {
            this.messageListener(msg)
            this.onMessage(msg)
        })
    }

    private onMessage(msg: Message) {

        const data = JSON.parse(msg.Data)
        switch (msg.Action) {
            case ActionChatMessage:
                this.onChatMessage(data)
                break
            case ActionGroupMessage:
                break
            case RespActionFriendApproval:
                this.contactsList.updateAll().then()
                break
            case ActionGroupJoin:
                this.contactsList.onNewGroup(data)
                break
            case ActionGroupAddMember:
                const r: GroupAddMember = data
                const group = this.contactsList.getGroup(r.Gid)
                group?.onNewMember(r.Members)
                break
            case ActionUserNewChat:
                this.chatList.add(data)
                break
            case ActionGroupUpdate:
                break
        }
    }

    private onChatMessage(msg: IChatMessage) {
        this.chatList.onChatMessage(ChatMessage.create(msg))
    }

    private onWsStateChanged(state: State, msg: string) {
        if (state === State.CLOSED && this) {
            if (this.userStateListener) {
                this.userStateListener(false)
            }
            this.chatList.clear()
            this.uid = -1
        }
    }
}

export const client = new Client()




