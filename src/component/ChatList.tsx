import {
    Avatar,
    Box,
    Divider,
    Grid,
    IconButton,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Typography
} from "@material-ui/core";
import React, {useEffect, useState} from "react";
import {client} from "../im/client";
import {Refresh} from "@material-ui/icons";
import {ChatRoom} from "./Room";
import {Chat, ChatMessage} from "../im/Chat";

export function ChatList() {

    console.log("enter chat list")
    const [chatList, setChatList] = useState(client.chatList.getAllChat())
    const [chat, setChat] = useState(client.chatList.getCurrentChat())

    useEffect(()=>{
        client.chatList.setChatListUpdateListener((chats => {
            console.log("chat list update")
            setChatList(() => [...chats])
        }))
    })

    const onChatUpdate = (chat: Chat) => {

    }

    const onChatMessage = (msg: ChatMessage) => {

    }

    const list = chatList.flatMap(value => (
            <div key={value.Cid}>
                <ListItem style={{cursor: "pointer"}} onClick={() => {
                    const c = client.chatList.get(value.Cid)
                    client.chatList.setCurrentChat(c, onChatUpdate, onChatMessage)
                    setChat(client.chatList.getCurrentChat())
                }}>
                    <ListItemIcon>
                        <Avatar/>
                    </ListItemIcon>
                    <ListItemText primary={value.Title}
                                  secondary={`${value.LatestMsg}`}/>
                </ListItem>
                <Divider/>
            </div>
        )
    )

    const refresh = () => {
        client.chatList?.update()
    }
    return <Box style={{height: "700px"}}>

        <Grid alignItems={"center"} container style={{}}>
            <Grid item md={4} style={{borderRight: "#ccc 2px solid", height: "700px"}}>
                <Box m={2}>
                    <Typography variant={"caption"}>Messages</Typography>
                    <IconButton size={"small"} onClick={refresh}>
                        <Refresh/>
                    </IconButton>
                </Box>
                <Divider/>
                <List style={{overflow: "auto"}}>
                    {list}
                    <ListItem>
                        <ListItemText primary={" "}/>
                    </ListItem>
                </List>
            </Grid>
            <Grid item md={8} style={{height: "700px"}}>
                <ChatRoom chat={chat}/>
            </Grid>
        </Grid>

    </Box>
}
