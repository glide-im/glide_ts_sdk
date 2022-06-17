import { ContactsBean } from "../api/model";
import { IMUserInfo } from "./def";

export class Contacts {

    public avatar: string;
    public name: string;
    public id: string;
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

    public setInfo(u: IMUserInfo){
        this.avatar = u.avatar;
        this.name = u.name;
    }

    private init() {

    }
}
