import {IMUserInfo} from "./def";
import {Ws} from "./ws";
import {Actions, Message} from "./message";
import {Cache} from "./cache";

export class Channel {

    public Avatar: string;
    public Id: string;
    public Name: string;
    public Members: Map<string, IMUserInfo> = new Map()

    public onMemberAdd: (m: IMUserInfo) => void | null = null
    public onMemberRemove: (m: string) => void | null = null

    constructor(id: string) {
        this.Id = id
        this.Name = id
    }

    public init() {
        Ws.addMessageListener((m) => {
            switch (m.action) {
                case Actions.MessageGroup:
                    const data = m.data as Message;
                    this.onMessage(data)
                    break;
            }
        })
    }

    public onMessage(m: Message) {
        switch (m.type) {
            case 100:
                Cache.loadUserInfo(m.content).subscribe((us) => {
                    const u = us[0]
                    this.Members.set(m.content, u)
                    this.onMemberAdd?.(u)
                })
                break;
            case  101:
                this.Members.delete(m.content)
                this.onMemberRemove?.(m.content)
                break;
        }
    }

    public getMembers(): Array<IMUserInfo> {
        return Array.from(this.Members.values())
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

class _channelList {

    private _list: Map<string, Channel> = new Map()

    public getChannel(id: string): Channel | null {
        if (!this._list.has("the_world_channel")) {
            this._list.set('the_world_channel', new Channel('the_world_channel'))
        }
        if (!this._list.has(id)) {
            return null
        }
        return this._list.get(id)
    }
}

export const ChannelList = new _channelList()