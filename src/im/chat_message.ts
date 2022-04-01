import { Message } from "./message";
import { Account } from "./account";

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
        ret.Mid = m.Mid.toString();
        ret.SendAt = m.SendAt.toString();
        ret.IsMe = m.From === Account.getInstance().getUID();
        return ret;
    }

}
