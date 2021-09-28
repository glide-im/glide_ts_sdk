import {ActionUserAddFriend, ActionContactsGet, ContactsResponse, IContacts, UserInfo} from "./message";
import {Group} from "./group";
import {Ws} from "./ws";
import {client, MessageLevel} from "./client";

export class ContactsList {

    public onContactsChange: () => void | null = null

    private groups = new Map<number, Group>()
    private friends = new Map<number, UserInfo>()

    public updateAll(): Promise<any> {
        console.log("ContactsList/updateAll")
        this.groups.clear()
        this.friends.clear()

        return Ws.request<ContactsResponse>(ActionContactsGet)
            .then(value => this.updateContactsList(value).then())
            .finally(() => {
                if (this.onContactsChange) {
                    this.onContactsChange()
                }
                console.log("ContactsList/updateAll", "completed!")
            })
    }

    public addFriend(uid: number, remark?: string): Promise<ContactsResponse> {
        console.log("ContactsList/addFriend", uid, remark)
        return Ws.request<ContactsResponse>(ActionUserAddFriend, {Uid: uid, Remark: remark})
            .then(value => this.updateContactsList(value))
            .finally(() => {
                console.log("ContactsList/addFriend", "completed!")
                if (this.onContactsChange) {
                    this.onContactsChange()
                }
            })
    }

    public onNewContacts(contacts: ContactsResponse) {
        console.log('ContactsList/onNewContacts')
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

    public onNewGroup(g: Group) {
        console.log('ContactsList/onNewGroup')
        this.groups.set(g.Gid, g)
    }

    public getGroup(gid): Group | null {
        return this.groups.get(gid) ?? null
    }

    public getFriend(uid): UserInfo | null {
        return this.friends.get(uid) ?? null
    }

    public getAllGroup(): Group[] {
        const ret: Group[] = []
        this.groups.forEach(value => {
            ret.push(value)
        })
        return ret
    }

    public getAllFriend(): UserInfo[] {
        const ret: UserInfo[] = []
        this.friends.forEach(value => {
            ret.push(value)
        })
        return ret
    }

    public getAllContacts(): IContacts[] {
        const ret: IContacts[] = []
        for (let userInfo of this.getAllFriend()) {
            ret.push({Avatar: userInfo.Avatar, Id: userInfo.Uid, Name: userInfo.Nickname, Type: 1})
        }
        for (let group of this.getAllGroup()) {
            ret.push({Avatar: group.Avatar, Id: group.Gid, Name: group.Name, Type: 2})
        }
        return ret
    }

    public clear() {
        this.friends.clear()
        this.groups.clear()
    }

    private updateContactsList(contactsResponse: ContactsResponse): Promise<ContactsResponse> {
        for (let friend of contactsResponse.Friends) {
            this.friends.set(friend.Uid, friend)
        }
        const member: number[] = []
        for (let group of contactsResponse.Groups) {
            member.push(...group.Members.map(m => m.Uid))
            this.groups.set(group.Gid, Group.create(group))
        }
        return client.getUserInfo(member).then(() => contactsResponse)
    }
}
