import {Callback, Ws} from "./ws";
import {
    ActionChatMessage,
    ActionOnlineUser,
    ActionUserGetInfo,
    ActionUserLogin,
    ActionUserRegister,
    AuthResponse,
    UserInfo
} from "./message";
import {ChatMessage} from "./Chat";
import {ChatList} from "./ChatList";


export class Client {

    chatList: ChatList = new ChatList()
    private userInfo: Map<number, UserInfo> = new Map<number, UserInfo>()
    private uid: number = -1

    public login(account: string, password: string, callback: Callback<AuthResponse>) {

        let m = {Account: account, Password: password}

        Ws.sendMessage<any>(ActionUserLogin, m, ((success, result: AuthResponse, msg) => {
            if (success) {
                this.uid = result.Uid
                this.onAuthed()
            }
            callback(success, result, msg)
        }))
    }

    public register(account: string, password: string, callback: Callback<boolean>) {

        let m = {Account: account, Password: password}
        Ws.sendMessage<any>(ActionUserRegister, m, callback)
    }

    public getAllOnlineUser(callback: (ret: UserInfo[]) => void) {
        Ws.sendMessage<UserInfo[]>(ActionOnlineUser, "", ((success, result, msg) => {
            if (!success) {
                console.log(msg)
                return
            }
            result.forEach((v) => {
                this.userInfo.set(v.Uid, v)
            })
            callback(result)
        }))
    }

    public getUserInfo(uids: number[], callback: (u) => void) {
        Ws.sendMessage(ActionUserGetInfo, uids, callback)
    }

    public getMyUid(): number {
        return this.uid
    }

    public getChatTitle(id: number, type: number): string {
        if (type === 1 && this.userInfo.has(id)) {
            return this.userInfo.get(id).Nickname
        }
        return "-"
    }

    private onAuthed() {
        this.getAllOnlineUser(() => {

        })
        this.chatList.update()
        // this.updateChatList()
        Ws.addMessageListener((msg => {
            if (msg.Action === ActionChatMessage) {
                this.onNewMessage(JSON.parse(msg.Data))
            }
            // something else
        }))
    }

    private onNewMessage(msg: ChatMessage) {
        this.chatList.onChatMessage(msg)
    }
}

export let client = new Client()






