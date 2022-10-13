import {IMUserInfo} from "./def";

export class Channel {

    public Avatar: string;
    public Id: string;
    public Name: string;
    public Members: Array<IMUserInfo>

    public onMemberAdd: (m: IMUserInfo) => void | null = null
    public onMemberRemove: (m: IMUserInfo) => void | null = null

    public static create(id: string): Channel {
        const ret = new Channel()
        ret.Id = id
        ret.Name = id
        return ret
    }

    public initMemberInfo(): Promise<any> {
        return
    }

    public update(g: any) {
        this.Avatar = g.Avatar
        this.Id = g.Gid
        this.Name = g.Name
        this.Members = g.Members
    }
}
