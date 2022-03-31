
export class Group {

    public Avatar: string;
    public CreateAt: number;
    public Gid: number;
    public Mute: boolean;
    public Name: string;
    public Notice: string;
    public Owner: number;
    public Members:[]

    public onUpdate: () => void | null = null

    public static create(g:any): Group {
        const ret = new Group()
        ret.update(g)
        return ret
    }

    public initMemberInfo(): Promise<any> {

        return
    }

    public onNewMember() {


    }

    public update(g: any) {
        this.Avatar = g.Avatar
        this.CreateAt = g.CreateAt
        this.Gid = g.Gid
        this.Mute = g.Mute
        this.Name = g.Name
        this.Notice = g.Notice
        this.Owner = g.Owner
        this.Members = g.Members
    }

    public inviteToGroup(gid: number, uid: number[]) {

    }
}
