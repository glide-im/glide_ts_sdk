import { ContactsBean } from "../api/model";

export class Contacts {

    public avatar: string;
    public name: string;
    public id: number;
    public type: number;
    public sid: string;

    public static create(b: ContactsBean): Contacts {
        let contact = new Contacts();
        contact.avatar = "";
        contact.name = b.Id.toString();
        contact.id = b.Id;
        contact.type = b.Type;

        contact.sid = ""
        contact.init();
        return contact;
    }

    private init() {

    }
}
