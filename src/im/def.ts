
export interface IMGroupMember {
    uid: string;
    name: string;
    avatar: string;
    status: string;
    isOwner: boolean;
    isManager: boolean;
}

export interface IMUserInfo {
    uid: number;
    name: string;
    avatar: string;
}
