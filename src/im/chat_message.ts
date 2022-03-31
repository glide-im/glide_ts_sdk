import {CommonMessage} from "./message";

export class ChatMessage {

    public Sender: number;
    public Content: string;
    public Mid: string;
    public SendAt: string;
    public IsGroup: boolean;

    public static create(m: CommonMessage): ChatMessage {
        return new ChatMessage();
    }
}
