import {Message} from "./message";

export class ChatMessage {

    public Sender: string;
    public Content: string;
    public Mid: string;
    public SendAt: string;

    public static create(m: Message): ChatMessage {
        return new ChatMessage();
    }
}
