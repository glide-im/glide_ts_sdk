import {ActionUserAddFriend, ActionUserRelation, Friend, IContacts, Relation, UserInfo} from "./message";
import {Group} from "./group";
import {Ws} from "./ws";
import {client} from "./client";

export class ContactsList {

    public onContactsChange: () => void | null = null

    private groups = new Map<number, Group>()
    private friends = new Map<number, UserInfo>()

    public updateAll(): Promise<any> {
        console.log("ContactsList/updateAll")
        this.groups.clear()
        this.friends.clear()

        return Ws.request<Relation>(ActionUserRelation)
            .then(value => {
                for (let friend of value.Friends) {
                    this.friends.set(friend.Uid, friend)
                }
                const member: number[] = []
                for (let group of value.Groups) {
                    member.push(...group.Members.map(m => m.Uid))
                    this.groups.set(group.Gid, group)
                }
                return client.getUserInfo(member)
            })
            .finally(() => {
                console.log("ContactsList/updateAll", "completed!")
            })
    }

    public addFriend(uid: number, remark?: string): Promise<Friend> {
        console.log("ContactsList/addFriend", uid, remark)
        return Ws.request<Friend>(ActionUserAddFriend, {Uid: uid, Remark: remark})
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
}
