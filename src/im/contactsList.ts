import {ActionUserAddFriend, ActionUserRelation, Friend, IContacts, Relation, UserInfo} from "./message";
import {Group} from "./group";
import {Ws} from "./ws";
import {client} from "./client";

export class ContactsList {

    public onContactsChange: () => void | null = null
    private allContacts: IContacts[] = []

    private groups = new Map<number, Group>()
    private friends = new Map<number, UserInfo>()

    public updateAll(): Promise<any> {
        console.log("ContactsList/init")
        this.groups.clear()
        this.friends.clear()
        this.allContacts = []

        return Ws.request<Relation>(ActionUserRelation)
            .then(value => {
                for (let friend of value.Friends) {
                    this.friends.set(friend.Uid, friend)
                }
                for (let group of value.Groups) {
                    this.groups.set(group.Gid, group)
                }
            })
            .catch(reason => client.catchPromiseReject(reason))
            .finally(() => {
                console.log("ContactsList/init", "completed!")
            })
    }

    public addFriend(uid: number, remark?: string): Promise<Friend> {
        console.log("ContactsList/addFriend", uid, remark)
        return Ws.request<Friend>(ActionUserAddFriend, {Uid: uid, Remark: remark})
            .catch(reason => client.catchPromiseReject(reason))
            .finally(() => {
                console.log("ContactsList/addFriend", "completed!")
                this.updateAll().then()
            })
    }

    public onNewGroup(g: Group) {
        console.log('ContactsList/onNewGroup')
        if (this.onContactsChange) {
            this.onContactsChange()
        }
        this.allContacts.push(g.toContacts())
        this.groups.set(g.Gid, g)
    }

    public getGroup(gid): Group | null {
        return this.groups.get(gid) ?? null
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

    public getContacts():IContacts[]{
        const ret: IContacts[] = []
        for (let userInfo of this.getAllFriend()) {
            ret.push({Avatar: userInfo.Avatar, Id:userInfo.Uid, Name: userInfo.Nickname, Type: 1})
        }
        for (let group of this.getAllGroup()) {
            ret.push({Avatar: group.Avatar, Id:group.Gid, Name: group.Name, Type: 2})
        }
        return ret
    }

    public clear() {
        this.allContacts = []
    }
}
