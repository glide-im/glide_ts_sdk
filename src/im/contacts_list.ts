import { filter, map, mergeMap, Observable, of, toArray } from "rxjs";
import { onNext } from "src/rx/next";
import { Api } from "../api/api";
import { ContactsBean } from "../api/model";
import { Contacts } from "./contacts";
import { Glide } from "./glide";

export class ContactsList {

    private contacts: Map<number, Contacts> = new Map<number, Contacts>();

    public onContactsChange: () => void | null = null;

    public init(): Observable<ContactsList> {
        return this.getContactList()
            .pipe(
                mergeMap(() => of(this))
            )
    }

    public getContactList(): Observable<Contacts[]> {
        if (this.contacts.size > 0) {
            return of(Array.from(this.contacts.values()));
        }
        return Api.getContacts()
            .pipe(
                mergeMap(contacts => of(...contacts)),
                map(contacts => Contacts.create(contacts)),
                onNext(contacts => {
                    this.contacts.set(contacts.id, contacts);
                }),
                filter(c => c.type === 1),
                map(c => c.id),
                toArray(),
                mergeMap(ids => Glide.loadUserInfo(...ids)),
                onNext(userInfo => {
                    userInfo.forEach(u => {
                        this.contacts.get(u.uid)?.setInfo(u)
                    })
                }),
                mergeMap(() => of(Array.from(this.contacts.values())))
            )
    }

    public setContactsUpdateListener(listener: () => void | null) {
        this.onContactsChange = listener;
    }

    public addFriend(uid: number, remark?: string): Promise<ContactsBean> {
        console.log("ContactsList/addFriend", uid, remark);

        return Api.addContacts(uid)
    }

    public getAllContacts(): Contacts[] {
        return Array.from(this.contacts.values());
    }

    public clear() {

    }

}
