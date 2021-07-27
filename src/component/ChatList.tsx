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
import {Chat} from "../im/message";
import {Refresh} from "@material-ui/icons";
import {ChatComp} from "./Room";

const emptyChats: Chat[] | null = []
const noneChat: Chat | null = null

export function ChatList() {

    const [chatList, setChatList] = useState(emptyChats)
    const [chat, setChat] = useState(noneChat)

    useEffect(() => {
        client.subscribeChatList((success, result, msg) => {
            if (success) {
                setChatList(() => result)
                if (result.length > 0) {
                    setChat(() => result[0])
                }
            }
        })
    }, [])

    const list = chatList?.flatMap(value => (
            <div  key={value.Cid}>
                <ListItem style={{cursor: "pointer"}} onClick={() => {
                    setChat(value)
                }}>
                    <ListItemIcon>
                        <Avatar/>
                    </ListItemIcon>
                    <ListItemText primary={`${value.Cid}-${value.Target}`}
                                  secondary={`${value.NewMessageAt}-${value.ReadAt}`}/>
                </ListItem>
                <Divider/>
            </div>
        )
    )

    const refresh = () => {
        client.getChatList(((success, result, msg) => {
            if (success) {
                setChatList(result)
            }
        }))
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
                <ChatComp chat={chat}/>
            </Grid>
        </Grid>

    </Box>
}
