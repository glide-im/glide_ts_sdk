import {Message} from "./message";
import {IMAccount} from "./account";

export class ChatMessage {

    public From: number;
    public To: number;
    public Content: string;
    public Mid: string;
    public SendAt: string;

    public IsMe: boolean;
    public IsGroup: boolean;

    public static create(m: Message): ChatMessage {
        const ret = new ChatMessage();
        ret.From = m.From;
        ret.To = m.To;
        ret.Content = m.Content;
        ret.Mid = m.Mid;
        ret.SendAt = m.SendAt.toString();
        ret.IsMe = m.From === IMAccount.getUID();
        return ret;
    }

}
