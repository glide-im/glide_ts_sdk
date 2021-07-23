import React from "react";

export interface GlobalConfig {
    CurrentChatId: number
}

export const DefaultConfig: GlobalConfig = {
    CurrentChatId: -1
}

export const ChatContext = React.createContext(DefaultConfig)
