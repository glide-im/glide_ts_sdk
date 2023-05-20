import {filter, map, mergeMap, Observable, of, tap, toArray} from "rxjs";
import {Api} from "../api/api";
import {ContactsBean} from "../api/model";
import {Contacts} from "./contacts";
import {Cache} from "./cache";

export class ContactsList {

    private contacts: Map<string, Contacts> = new Map<string, Contacts>();

    public onContactsChange: () => void | null = null;

    public init(): Observable<ContactsList> {
        return this.getOrInitContactList()
            .pipe(
                mergeMap(() => of(this))
            )
    }

    public onNewContactNotify(n: any) {
        const ct: Contacts = new Contacts();
        ct.id = n.Id
        ct.type = n.Type
        this.contacts.set(ct.id, ct);
        this.onContactsChange?.();
    }

    public getContacts(): Contacts[] {
        const c = this.contacts.values();
        return Array.from(c);
    }

    public getOrInitContactList(): Observable<Contacts[]> {
        if (this.contacts.size > 0) {
            return of(Array.from(this.contacts.values()));
        }
        return Api.getContacts()
            .pipe(
                mergeMap(contacts => of(...contacts)),
                map(contacts => Contacts.create(contacts)),
                tap(contacts => {
                    this.contacts.set(contacts.id, contacts);
                }),
                filter(c => c.type === 1),
                map(c => c.id),
                toArray(),
                mergeMap(ids => Cache.loadUserInfo(...ids)),
                tap(userInfo => {
                    userInfo.forEach(u => {
                        this.contacts.get(u.id)?.setInfo(u)
                    })
                }),
                mergeMap(() => of(Array.from(this.contacts.values())))
            )
    }

    public setContactsUpdateListener(listener: () => void | null) {
        this.onContactsChange = listener;
    }

    public addFriend(uid: string, remark?: string): Promise<ContactsBean> {
        return Api.addContacts(uid)
            .then((r) => {
                const c = new Contacts();
                c.id = uid;
                c.name = `${uid}`;
                c.type = 1;
                this.contacts.set(uid, c);
                return r;
            })
    }

    public getAllContacts(): Contacts[] {
        return Array.from(this.contacts.values());
    }

    public clear() {

    }

}
