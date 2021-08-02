import {Box, Divider, Grid, IconButton, List, ListItem, ListItemText, Typography} from "@material-ui/core";
import React, {useEffect, useState} from "react";
import {client} from "../im/client";
import {Refresh} from "@material-ui/icons";
import {ChatRoom} from "./ChatRoom";
import {ChatItem} from "./ChatItem";
import {Chat} from "../im/Chat";

const emptyChat: Chat | null = null
const emptyChats: Chat[] = []

export function ChatList() {

    const [chatList, setChatList] = useState(emptyChats)
    const [chat, setChat] = useState(emptyChat)

    console.log("ChatList", "enter chat list", chat, chatList)

    client.onUserStateChange(loggedIn => {
        if (!loggedIn) {
            client.chatList.setCurrentChat(null)
            setChatList([])
            return
        }
        client.chatList.asyncUpdate()
            .then((chats) => {

            }).catch(reason => {

        }).finally(() => {

        })
    })

    useEffect(() => {
        client.chatList.setChatListUpdateListener((chats => {
            console.log("ChatList", "chat list update", chats)
            setChatList(() => [...chats])
            if (chat == null) {
                setChat(client.chatList.getCurrentChat())
            }
        }))
    })

    const list = chatList.flatMap(value => (
            <ChatItem key={value.Cid + value.UcId} chat={value} onSelect={setChat}/>
        )
    )

    const refresh = () => {
        client.chatList?.asyncUpdate()
            .then(c => {
                console.log("ChatList refresh")
                setChatList(c)
            })
            .catch(reason => {
                console.log("ChatList", reason)
            })
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
