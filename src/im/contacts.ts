import {ContactsBean} from "../api/model";
import {IMAccount} from "./client";

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
        contact.id = b.Id.toString();
        contact.type = b.Type;

        contact.sid = ""
        contact.init();
        return contact;
    }

    public getSID(): string {

        if (this.type === 2) {
            return this.id;
        }

        let lg = IMAccount.getUID();
        let sm = parseInt(this.id.toString());

        if (lg < sm) {
            let tmp = lg;
            lg = sm;
            sm = tmp;
        }

        return lg + "_" + sm;
    }

    private init() {

    }
}
