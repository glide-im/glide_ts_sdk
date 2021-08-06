import {Avatar, ListItem, ListItemIcon, ListItemText} from "@material-ui/core";
import {client} from "../im/client";
import React, {useState} from "react";
import {Chat, ChatMessage} from "../im/chat";

export function ChatItem(props: { chat: Chat, onSelect: (c: Chat) => void }) {

    console.log("ChatItem", "load chat item UcId=", props.chat.UcId)
    const [chat, setChat] = useState(props.chat)

    chat.setUpdateListener(c => {
        console.log("ChatItem", "chat updated")
        setChat(c)
    })

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

    return <div key={chat.Cid}>
        <ListItem button selected={client.chatList.getCurrentChat() === chat} style={{cursor: "pointer"}}
                  onClick={onItemClick}>
            <ListItemIcon>
                <Avatar/>
            </ListItemIcon>
            <ListItemText primary={!chat.Title ? "-" : chat.Title}
                          secondary={`${!chat.LatestMsg ? " " : chat.LatestMsg}`}/>
        </ListItem>
    </div>
}
