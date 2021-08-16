import {Avatar, ListItem, ListItemIcon, ListItemText} from "@material-ui/core";
import {client} from "../im/client";
import React, {useEffect, useState} from "react";
import {Chat, ChatMessage} from "../im/chat";

export function ChatItem(props: { chat: Chat, onSelect: (c: Chat) => void }) {

    console.log("ChatItem", "load chat item UcId=", props.chat.UcId)
    const [chat, setChat] = useState({obj: props.chat})

    useEffect(() => {
        chat.obj.setUpdateListener(c => {
            console.log("ChatItem", "chat updated")
            setChat({obj: c})
        })
        return () => chat.obj.setUpdateListener(() => null)
    }, [chat])

    const onChatUpdate = (chat: Chat) => {
        setChat({obj: chat})
    }
    const onChatMessage = (msg: ChatMessage) => {

    }

    const onItemClick = () => {
        const c = client.chatList.get(chat.obj.Cid)
        client.chatList.setCurrentChat(c, onChatUpdate, onChatMessage)
        props.onSelect(client.chatList.getCurrentChat())
    }

    const lastMsg = chat.obj.getLastMessage()
    let hint = " "

    if (lastMsg != null) {
        const sender = client.getCachedUserInfo(lastMsg.Sender)
        if (sender != null) {
            hint = sender.Nickname + ": " + lastMsg.Message
        }
    }

    return <div key={chat.obj.Cid}>
        <ListItem button selected={client.chatList.getCurrentChat() === chat.obj} style={{cursor: "pointer"}}
                  onClick={onItemClick}>
            <ListItemIcon>
                <Avatar src={chat.obj.getTargetObj()?.Avatar ?? ""}/>
            </ListItemIcon>
            <ListItemText primary={!chat.obj.Title ? "-" : chat.obj.Title} secondary={hint}/>
        </ListItem>
    </div>
}
