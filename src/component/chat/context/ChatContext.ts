import React, { createContext } from 'react'

interface ChatContextValue {
    scrollToBottom: Function
}

export const ChatContext = createContext({
    scrollToBottom: Function,
} as ChatContextValue)