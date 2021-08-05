import {Callback, State, Ws} from "./ws";
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
import {Chat, ChatMessage} from "./Chat";
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

    public login(account: string, password: string, callback: Callback<AuthResponse>) {

        let m = {Account: account, Password: password}

        Ws.sendMessage<any>(ActionUserLogin, m, ((success, result: AuthResponse, msg) => {
            if (success) {
                this.uid = result.Uid
                this.onAuthed()
            }
            this.initContacts()
                .then(() => this.updateChatList())
                .then(() => {
                    if (this.userStateListener != null) {
                        this.userStateListener(true)
                    }
                })
                .catch(reason => this.onCatchApiException(reason))
                .finally(() => {
                    console.log("client/login", "complete")
                    callback(success, result, msg)
                })
        }))
    }

    public addFriend(uid: number, remark?: string): Promise<void> {
        return Ws.request<Friend>(ActionUserAddFriend, {Uid: uid, Remark: remark})
            .then(() => {
            })
            .catch(reason => this.onCatchApiException(reason))
            .finally(() => {
                this.updateContacts()
            })
    }

    public joinGroup(gid: number): Promise<void> {
        return Ws.request<Chat>(ActionGroupJoin, {Gid: gid})
            .then(() => {
            })
            .catch(reason => this.onCatchApiException(reason))
            .finally(() => {
                this.updateContacts()
                this.chatList.update()
            })
    }

    public createGroup(name: string): Promise<Group> {
        return Ws.request<Group>(ActionGroupCreate, {Name: name})
            .then(value => {
                this.updateContacts()
                return Promise.resolve(value)
            })
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

    public register(account: string, password: string, callback: Callback<boolean>) {

        let m = {Account: account, Password: password}
        Ws.sendMessage<any>(ActionUserRegister, m, callback)
    }

    public getAllOnlineUser(callback: (ret: UserInfo[]) => void) {
        Ws.request<UserInfo[]>(ActionOnlineUser)
            .then(u => {
                u.forEach((v) => {
                    this.userInfo.set(v.Uid, v)
                })
                callback(u)
            })
            .catch(reason => {
                this.onCatchApiException(reason)
            })
    }

    public getMyUid(): number {
        return this.uid
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

    public initContacts(): Promise<Contacts[]> {

        console.log("client/initContacts")
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
                console.log("client/initContacts", "complete! contacts=", this.contacts)
                if (this.contactChangeListener) {
                    this.contactChangeListener(this.contacts)
                }
                return Promise.resolve(this.contacts)
            })
    }

    public updateContacts() {
        console.log("client/updateContacts")
        this.initContacts()
            .then()
            .catch(reason => this.onCatchApiException(reason))
            .finally(() => {
                console.log("client/updateContacts", "completed")
            })
    }

    public updateChatList(): Promise<Chat[]> {
        console.log("client/updateChatList")
        return this.chatList.asyncUpdate()
            .then()
            .catch(reason => this.onCatchApiException(reason))
            .then(() => Promise.resolve(this.chatList.getAllChat()))
            .finally(() => {
                console.log("client/updateChatList", "completed")
            })
    }

    private getGroupInfo(gid: number[], update: boolean = false): Promise<Group[]> {
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
    }

    private getUserInfo(uid: number[], update: boolean = false): Promise<UserInfo[]> {
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
    }

    private onAuthed() {
        // this.getAllOnlineUser(() => {
        //
        // })
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
                this.updateContacts()
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

    private onCatchApiException(reason: string) {
        if (this.toaster) {
            this.toaster(reason)
        }
    }
}

export const client = new Client()




