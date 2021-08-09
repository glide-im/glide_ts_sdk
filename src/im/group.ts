import {IGroup, IGroupMember} from "./message";

export class Group implements IGroup {

    public Avatar: string;
    public CreateAt: number;
    public Gid: number;
    public Mute: boolean;
    public Name: string;
    public Notice: string;
    public Owner: number;
    public Members: IGroupMember[]
}
