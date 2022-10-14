export interface IMGroupMember {
    uid: string;
    name: string;
    avatar: string;
    status: string;
    isOwner: boolean;
    isManager: boolean;
}

export interface IMUserInfo {
    uid: string;
    name: string;
    avatar: string;
}

export interface ChannelInfo {
    id: string;
    name: string;
    avatar: string;
}