import {ContactsResponse, IContacts, UserInfo} from "./message";
import {Group} from "./group";
import {client, MessageLevel} from "./client";
import {addContacts, getContacts} from "../api/api";
import {ContactsBean} from "../api/model";

export class ContactsList {

    public onContactsChange: () => void | null = null;


    public refresh() {
        getContacts().then(contacts => {

            contacts.forEach(c => {
                if (c.Type === 1) {

                } else {

                }
            });
        });
    }

    public setContactsAddListener(listener: () => void | null) {
        this.onContactsChange = listener;
    }

    public addFriend(uid: number, remark?: string): Promise<ContactsBean> {
        console.log("ContactsList/addFriend", uid, remark);

        return addContacts(uid)
    }

    public onNewContacts(contacts: ContactsResponse) {
        console.log('ContactsList/onNewContacts');
        for (let friend of contacts.Friends) {
            client.showMessage(MessageLevel.LevelInfo, `New Friend: ${friend.Nickname}, Uid=${friend.Uid}`)
        }
        for (let group of contacts.Groups) {
            client.showMessage(MessageLevel.LevelInfo, `New Group: ${group.Name}, Gid=${group.Gid}`)
        }

        this.updateContactsList(contacts)
            .then(value => {
                if (this.onContactsChange) {
                    this.onContactsChange()
                }
            })
    }

    public getGroup(gid): Group | null {
        return null
    }

    public getFriend(uid): UserInfo | null {
        return null
    }

    public getAllGroup(): Group[] {
        return []
    }

    public getAllFriend(): UserInfo[] {
        return []
    }

    public getAllContacts(): IContacts[] {
        const ret: IContacts[] = [];
        for (let userInfo of this.getAllFriend()) {
            ret.push({Avatar: userInfo.Avatar, Id: userInfo.Uid, Name: userInfo.Nickname, Type: 1})
        }
        for (let group of this.getAllGroup()) {
            ret.push({Avatar: group.Avatar, Id: group.Gid, Name: group.Name, Type: 2})
        }
        return ret
    }

    public clear() {

    }

    private updateContactsList(contactsResponse: ContactsResponse): Promise<ContactsResponse> {

        return Promise.reject("Not Implemented")
    }
}

export const IMContactsList = new ContactsList();
