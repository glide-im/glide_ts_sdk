import {Box, Divider, Grid, IconButton, List, ListItem, ListItemText, Typography} from "@material-ui/core";
import React, {useEffect, useState} from "react";
import {client} from "../im/client";
import {Refresh} from "@material-ui/icons";
import {ChatRoom} from "./ChatRoom";
import {ChatItem} from "./ChatItem";

export function ChatList() {

    const [chatList, setChatList] = useState(client.chatList.getAllChat())
    const [chat, setChat] = useState(client.chatList.getCurrentChat())

    console.log("ChatList", "enter chat list cid=", chat?.Cid, "len=", chatList.length)

    useEffect(() => {
        client.chatList.setChatListUpdateListener((chats => {
            console.log("ChatList", "chat list update", chats)
            setChatList(() => [...chats])
            if (chat == null) {
                setChat(client.chatList.getCurrentChat())
            }
        }))
    })

    const list = chatList.flatMap(value =>
        (<ChatItem key={value.Cid + value.UcId} chat={value} onSelect={setChat}/>)
    )

    const refresh = () => {
        client.chatList.update().then()
    }
    return <Box style={{height: "700px"}}>

        <Grid alignItems={"center"} container style={{}}>
            <Grid item md={4} style={{height: "700px"}}>
                <Box m={2}>
                    <Typography variant={"caption"}>Messages</Typography>
                    <IconButton size={"small"} onClick={refresh} style={{float: "right"}}>
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
                <Divider orientation={"vertical"} style={{float: "left"}}/>
                <ChatRoom chat={chat}/>
            </Grid>
        </Grid>

    </Box>
}
