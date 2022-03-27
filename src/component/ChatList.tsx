import {
    Box,
    CircularProgress,
    Divider,
    Grid,
    IconButton,
    List,
    ListItem,
    ListItemText,
    Typography
} from "@mui/material";
import React, {useEffect, useState} from "react";
import {client} from "../im/client";
import {ChatRoom} from "./ChatRoom";
import {ChatItem} from "./ChatItem";
import {Refresh} from "@mui/icons-material";
import {getRecentSession} from "../api/api";
import {Session} from "../im/session";
import {SessionBean} from "../api/model";

const emptySession: Session[] = [];

export function ChatList() {

    const [chatList, setChatList] = useState(emptySession)
    const [chat, setChat] = useState(null)

    const [loading, setLoading] = useState(true)

    useEffect(() => {
        Promise
            .resolve(() => setLoading(true))
            .then(() => getRecentSession())
            .then(res => res.map(item => Session.fromSessionBean(item)))
            .then(res => {
                const sessionBean: SessionBean = {
                    CreateAt: 0, LastMid: 1, Uid1: 2, Uid2: 3, Unread: 0, UpdateAt: 0
                }
                res.push(Session.fromSessionBean(sessionBean))
                setChatList(res)
            })
            .finally(() => {
                setLoading(false)
            })
    }, [])

    const list = chatList.flatMap((value: Session) =>
        (<ChatItem key={value.ID} chat={value} onSelect={setChat}/>)
    )

    const refresh = () => {

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
                {loading ?
                    <Box sx={{display: "flex", justifyContent: "center", paddingTop: "50%"}}>
                        <CircularProgress/>
                    </Box>
                    :
                    <List style={{overflow: "auto"}}>
                        {loading ? <CircularProgress/> : list}
                        <ListItem>
                            <ListItemText primary={" "}/>
                        </ListItem>
                    </List>
                }
            </Grid>
            <Grid item md={8} style={{height: "700px"}}>
                <Divider orientation={"vertical"} style={{float: "left"}}/>
                <ChatRoom chat={chat}/>
            </Grid>
        </Grid>

    </Box>
}
