import {Group} from "./group";
import {Api} from "../api/api";
import {Contacts} from "./contacts";
import {ContactsBean, UserInfoBean} from "../api/model";

export class ContactsList {

    public onContactsChange: () => void | null = null;

    public loadContacts(): Promise<Contacts[]> {
        return Api.getContacts()
            .then(contacts => {
                return contacts.map(c => Contacts.create(c));
            });
    }

    public setContactsAddListener(listener: () => void | null) {
        this.onContactsChange = listener;
    }

    public addFriend(uid: number, remark?: string): Promise<ContactsBean> {
        console.log("ContactsList/addFriend", uid, remark);

        return Api.addContacts(uid)
    }


    public getGroup(gid): Group | null {
        return null
    }

    public getFriend(uid): UserInfoBean | null {
        return null
    }

    public getAllGroup(): Group[] {
        return []
    }

    public getAllFriend(): UserInfoBean[] {
        return []
    }

    public getAllContacts(): Contacts[] {
        const ret: Contacts[] = [];
        // for (let userInfo of this.getAllFriend()) {
        //     ret.push({Avatar: userInfo.Avatar, Id: userInfo.Uid, Name: userInfo.Nickname, Type: 1})
        // }
        // for (let group of this.getAllGroup()) {
        //     ret.push({Avatar: group.Avatar, Id: group.Gid, Name: group.Name, Type: 2})
        // }
        return ret
    }

    public clear() {

    }

}

export const IMContactsList = new ContactsList();
