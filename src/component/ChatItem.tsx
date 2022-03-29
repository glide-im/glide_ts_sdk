import {Avatar, ListItem, ListItemIcon, ListItemText} from "@mui/material";
import React, {useEffect, useState} from "react";
import {Session} from "../im/session";

export function ChatItem(props: { chat: Session, selected: boolean, onSelect: (c: Session) => void }) {

    console.log("ChatItem", "load chat item UcId=", props.chat.ID);
    const [chat, setChat] = useState({obj: props.chat})

    useEffect(() => {
        chat.obj.setUpdateListener(c => {
            console.log("ChatItem", "chat updated")
            setChat({obj: c})
        })
        return () => chat.obj.setUpdateListener(() => null)
    }, [chat])

    const onItemClick = () => {
        // const c = client.chatList.get(chat.ID)
        // client.chatList.setCurrentChat(c, onChatUpdate, onChatMessage)
        props.onSelect(chat.obj)
    }

    return <div key={chat.obj.ID}>
        <ListItem button style={{cursor: "pointer"}}
                  onClick={onItemClick} selected={props.selected}>
            <ListItemIcon>
                <Avatar src={""}/>
            </ListItemIcon>
            <ListItemText primary={!chat.obj.Title ? "-" : chat.obj.Title} secondary={"-"}/>
        </ListItem>
    </div>
}
