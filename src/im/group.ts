import {ActionGroupAddMember, IContacts, IGroup, IGroupMember} from "./message";
import {Ws} from "./ws";
import {client, MessageLevel} from "./client";

export class Group implements IGroup {

    public Avatar: string;
    public CreateAt: number;
    public Gid: number;
    public Mute: boolean;
    public Name: string;
    public Notice: string;
    public Owner: number;
    public Members: IGroupMember[]

    public onUpdate: () => void | null = null

    public static create(g: IGroup): Group {
        const ret = new Group()
        ret.update(g)
        return ret
    }

    public initMemberInfo(): Promise<any> {

        return
    }

    public onNewMember(m: IGroupMember[]) {
        this.Members.push(...m)
        client.getUserInfo(m.map(value => value.Uid))
            .then()
            .finally(() => {
                if (this.onUpdate) {
                    this.onUpdate()
                }
            })
    }

    public update(g: IGroup) {
        this.Avatar = g.Avatar
        this.CreateAt = g.CreateAt
        this.Gid = g.Gid
        this.Mute = g.Mute
        this.Name = g.Name
        this.Notice = g.Notice
        this.Owner = g.Owner
        this.Members = g.Members
    }

    public inviteToGroup(gid: number, uid: number[]): Promise<any> {
        return Ws.request<any>(ActionGroupAddMember, {Gid: gid, Uid: uid})
            .then(value => {
                client.showMessage(MessageLevel.LevelSuccess, `Add Member Success`)
                return value
            })
    }

    public toContacts(): IContacts {
        return {
            Avatar: this.Avatar, Id: this.Gid, Name: this.Name, Type: 2
        }
    }
}
