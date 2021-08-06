import {State, Ws} from "./ws";
import {
    ActionChatMessage,
    ActionGroupCreate,
    ActionGroupInfo,
    ActionGroupJoin,
    ActionOnlineUser,
    ActionUserAddFriend,
    ActionUserGetInfo,
    ActionUserLogin,
    ActionUserRegister,
    ActionUserRelation,
    AuthResponse,
    Contacts,
    Friend,
    Group,
    Message,
    RespActionFriendApproval,
    UserInfo
} from "./message";
import {Chat, ChatMessage} from "./chat";
import {ChatList} from "./ChatList";

type ContactChangeListener = (u: Contacts[]) => void | null

class Client {

    public chatList = new ChatList()
    public contacts: Contacts[] = []

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
        this.contacts = []
        this.uid = -1
        return Ws.request<AuthResponse>(ActionUserLogin, m)
            .then(value => {
                this.uid = value.Uid
                this.onAuthed()
                return this.updateContacts()
                    .then(() => this.updateChatList())
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

    public addFriend(uid: number, remark?: string): Promise<Friend> {
        console.log("client/addFriend", uid, remark)
        return Ws.request<Friend>(ActionUserAddFriend, {Uid: uid, Remark: remark})
            .catch(reason => this.catchPromiseReject(reason))
            .finally(() => {
                console.log("client/addFriend", "completed!")
                this.updateContacts().then()
            })
    }

    public joinGroup(gid: number): Promise<Chat> {
        console.log("client/joinGroup", gid)
        return Ws.request<Chat>(ActionGroupJoin, {Gid: gid})
            .catch(reason => this.catchPromiseReject(reason))
            .finally(() => {
                console.log("client/joinGroup", "completed!")
                this.updateContacts().then()
                this.chatList.update()
            })
    }

    public createGroup(name: string): Promise<Group> {
        console.log("client/createGroup", name)
        return Ws.request<Group>(ActionGroupCreate, {Name: name})
            .then(value => {
                this.updateContacts().then()
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

    public updateContacts(): Promise<Contacts[]> {
        console.log("client/updateContacts")
        return Ws.request<Contacts[]>(ActionUserRelation)
            .then(value => {
                const friend: number[] = []
                const group: number[] = []
                for (let contact of value) {
                    if (contact.Type === 1) {
                        friend.push(contact.Id)
                    } else if (contact.Type === 2) {
                        group.push(contact.Id)
                    }
                }
                this.contacts = value
                return Promise.allSettled([
                    this.getGroupInfo(group),
                    this.getUserInfo(friend)
                ])
            })
            .then(value => {
                for (let contact of this.contacts) {
                    contact.Name = this.getChatTitle(contact.Id, contact.Type)
                }
                if (this.contactChangeListener) {
                    this.contactChangeListener(this.contacts)
                }
                return Promise.resolve(this.contacts)
            })
            .catch(reason => this.catchPromiseReject(reason))
            .finally(() => {
                console.log("client/updateContacts", "completed!")
            })
    }

    public updateChatList(): Promise<Chat[]> {
        console.log("client/updateChatList")
        return this.chatList.asyncUpdate()
            .catch(reason => this.catchPromiseReject(reason))
            .finally(() => {
                console.log("client/updateChatList", "completed!")
            })
    }

    private getGroupInfo(gid: number[], update: boolean = false): Promise<Group[]> {
        console.log("client/getGroupInfo", gid, update)
        const ids = update ? gid : gid.filter(value => {
            return !this.groupInfo.has(value)
        })
        if (ids.length === 0) {
            return Promise.resolve([])
        }
        return Ws.request<Group[]>(ActionGroupInfo, {Gid: gid})
            .then(value => {
                for (let group of value) {
                    this.groupInfo.set(group.Gid, group)
                }
                return Promise.resolve(value)
            })
            .catch(reason => this.catchPromiseReject(reason))
            .finally(() => {
                console.log("client/getGroupInfo", "completed!")
            })
    }

    private getUserInfo(uid: number[], update: boolean = false): Promise<UserInfo[]> {
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

    private onAuthed() {
        Ws.addMessageListener(msg => {
            this.onMessage(msg)
        })
    }

    private onMessage(msg: Message) {

        switch (msg.Action) {
            case ActionChatMessage:
                this.onChatMessage(JSON.parse(msg.Data))
                break
            case RespActionFriendApproval:
                this.updateContacts().then()
                break
        }
    }

    private onChatMessage(msg: ChatMessage) {
        this.chatList.onChatMessage(msg)
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

    private catchPromiseReject(reason: string): Promise<any> {
        if (this.toaster) {
            this.toaster(reason)
        }
        return Promise.reject(reason)
    }
}

export const client = new Client()




