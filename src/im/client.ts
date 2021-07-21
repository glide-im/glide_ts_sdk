import {ws} from "./ws";


export class Client {


    public login(username: string, password: string) {

        let m = {Username: username, Password: password}

        ws.sendMessage<any>(1048577, m, (success, result, msg) => {
            console.log(result)
        })
    }
}

export let client = new Client()
