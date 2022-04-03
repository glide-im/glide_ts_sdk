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
        ret.From = m.from;
        ret.To = m.to;
        ret.Content = m.content;
        ret.Mid = m.mid.toString();
        ret.SendAt = m.sendAt.toString();
        ret.IsMe = m.from === Account.getInstance().getUID();
        return ret;
    }

}
