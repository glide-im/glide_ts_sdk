import {Callback, ws} from "./ws";
import {
    ActionOnlineUser,
    ActionUserChatList,
    ActionUserLogin,
    ActionUserRegister,
    AuthResponse, Chat,
    SearchUser
} from "./message";

export class Client {

    public login(account: string, password: string, callback: Callback<AuthResponse>) {

        let m = {Account: account, Password: password}

        ws.sendMessage<any>(ActionUserLogin, m, callback)
    }

    public register(account: string, password: string, callback: Callback<boolean>) {

        let m = {Account: account, Password: password}

        ws.sendMessage<any>(ActionUserRegister, m, callback)
    }

    public getChatList(callback: Callback<Chat[]>) {
        ws.sendMessage(ActionUserChatList, "", callback)
    }

    public getAllOnlineUser(callback: Callback<SearchUser[]>) {
        ws.sendMessage<any>(ActionOnlineUser, "", callback)
    }

    public newChat() {

    }
}

export let client = new Client()
