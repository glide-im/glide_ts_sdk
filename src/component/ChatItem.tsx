import {Avatar, ListItem, ListItemIcon, ListItemText} from "@material-ui/core";
import {client} from "../im/client";
import React, {useEffect, useState} from "react";
import {Chat, ChatMessage} from "../im/chat";

export function ChatItem(props: { chat: Chat, onSelect: (c: Chat) => void }) {

    console.log("ChatItem", "load chat item UcId=", props.chat.UcId)
    const [chat, setChat] = useState(props.chat)

    useEffect(() => {
        chat.setUpdateListener(c => {
            console.log("ChatItem", "chat updated")
            setChat(c)
        })
        return () => chat.setUpdateListener(() => null)
    }, [chat])

    const onChatUpdate = (chat: Chat) => {
        setChat(chat)
    }
    const onChatMessage = (msg: ChatMessage) => {

    }

    const onItemClick = () => {
        const c = client.chatList.get(chat.Cid)
        client.chatList.setCurrentChat(c, onChatUpdate, onChatMessage)
        props.onSelect(client.chatList.getCurrentChat())
    }

    const lastMsg = chat.getLastMessage()
    let hint = " "

    if (lastMsg != null) {
        const sender = client.getCachedUserInfo(lastMsg.Sender)
        if (sender != null) {
            hint = sender.Nickname + ": " + lastMsg.Message
        }
    }

    return <div key={chat.Cid}>
        <ListItem button selected={client.chatList.getCurrentChat() === chat} style={{cursor: "pointer"}}
                  onClick={onItemClick}>
            <ListItemIcon>
                <Avatar src={chat.getTargetObj()?.Avatar ?? ""}/>
            </ListItemIcon>
            <ListItemText primary={!chat.Title ? "-" : chat.Title} secondary={hint}/>
        </ListItem>
    </div>
}
