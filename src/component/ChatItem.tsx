import {Avatar, ListItem, ListItemIcon, ListItemText} from "@mui/material";
import React, {useEffect, useState} from "react";
import {Session} from "../im/session";
import {ChatMessage} from "../im/oldSession";

export function ChatItem(props: { chat: Session, onSelect: (c: Session) => void }) {

    console.log("ChatItem", "load chat item UcId=", props.chat.ID);
    const [chat, setChat] = useState({obj: props.chat})

    useEffect(() => {
        chat.obj.setUpdateListener(c => {
            console.log("ChatItem", "chat updated")
            setChat({obj: c})
        })
        return () => chat.obj.setUpdateListener(() => null)
    }, [chat])

    const onChatUpdate = (chat: Session) => {
        setChat({obj: chat})
    }
    const onChatMessage = (msg: ChatMessage) => {

    }

    const onItemClick = () => {
        // const c = client.chatList.get(chat.ID)
        // client.chatList.setCurrentChat(c, onChatUpdate, onChatMessage)
        // props.onSelect(client.chatList.getCurrentChat())
    }

    return <div key={chat.obj.ID}>
        <ListItem button style={{cursor: "pointer"}}
                  onClick={onItemClick}>
            <ListItemIcon>
                <Avatar src={""}/>
            </ListItemIcon>
            <ListItemText primary={!chat.obj.Title ? "-" : chat.obj.Title} secondary={"-"}/>
        </ListItem>
    </div>
}
