import {Avatar, Divider, ListItem, ListItemIcon, ListItemText} from "@material-ui/core";
import {client} from "../im/client";
import React, {useState} from "react";
import {Chat, ChatMessage} from "../im/Chat";

export function ChatItem(props: { chat: Chat, onSelect: (c: Chat) => void }) {

    console.log("ChatItem", "load chat item", props.chat)
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

    return <div key={chat.Cid}>
        <ListItem style={{cursor: "pointer"}} onClick={() => {
            const c = client.chatList.get(chat.Cid)
            client.chatList.setCurrentChat(c, onChatUpdate, onChatMessage)
            props.onSelect(client.chatList.getCurrentChat())
        }}>
            <ListItemIcon>
                <Avatar/>
            </ListItemIcon>
            <ListItemText primary={!chat.Title ? "-" : chat.Title}
                          secondary={`${!chat.LatestMsg ? " " : chat.LatestMsg}`}/>
        </ListItem>
        <Divider/>
    </div>
}
