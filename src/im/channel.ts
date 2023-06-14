import { GlideBaseInfo } from './def';
import { IMWsClient } from './im_ws_client';
import { Actions, Message } from './message';
import { Cache } from './cache';
import { filter, map } from 'rxjs';

export class Channel {
    public Avatar: string;
    public Id: string;
    public Name: string;
    public Members: Map<string, GlideBaseInfo> = new Map();

    public onMemberAdd: (m: GlideBaseInfo) => void | null = null;
    public onMemberRemove: (m: string) => void | null = null;

    constructor(id: string) {
        this.Id = id;
        this.Name = id;
    }

    public init() {
        IMWsClient.messages()
            .pipe(
                filter((m) => m.action === Actions.MessageGroup),
                map((m) => m.data as Message)
            )
            .subscribe({
                next: (m) => this.onMessage(m),
            });
    }

    public onMessage(m: Message) {
        switch (m.type) {
            case 100:
                Cache.loadUserInfo(m.content).subscribe((us) => {
                    const u = us[0];
                    this.Members.set(m.content, u);
                    this.onMemberAdd?.(u);
                });
                break;
            case 101:
                this.Members.delete(m.content);
                this.onMemberRemove?.(m.content);
                break;
        }
    }

    public getMembers(): Array<GlideBaseInfo> {
        return Array.from(this.Members.values());
    }

    public initMemberInfo(): Promise<any> {
        return;
    }

    public update(g: any) {
        this.Avatar = g.Avatar;
        this.Id = g.Gid;
        this.Name = g.Name;
        this.Members = g.Members;
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