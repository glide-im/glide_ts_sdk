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
import {ChatRoom} from "./ChatRoom";
import {ChatItem} from "./ChatItem";
import {Refresh} from "@mui/icons-material";
import {Session} from "../im/session";
import {SessionBean} from "../api/model";
import {getRecentSession} from "../api/api";
import {useParams, useRouteMatch} from "react-router-dom";

const emptySession: Session[] = [];

function getSessions(): Promise<Session[]> {
    return getRecentSession()
        .then(s => {
            const res = s.map(item => Session.fromSessionBean(item))
            const sessionBean: SessionBean = {
                CreateAt: 0, LastMid: 1, Uid1: 2, Uid2: 3, Unread: 0, UpdateAt: 0
            }
            res.push(Session.fromSessionBean(sessionBean))
            return res
        }).catch(err => {
            return err.toString()
        })
}

export function ChatList() {

    const [chatList, setChatList] = useState(emptySession)
    const [chat, setChat] = useState(null)

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    // const { sid }  = useParams()
    // console.log(sid)

    useEffect(() => {

        setLoading(true)
        getSessions().then(res => {
            console.log(res)
            setChatList(res)
            setLoading(false)
        }).catch(err => {
            setError(err)
            // setLoading(false)
        })
    }, [])

    const list = chatList.flatMap((value: Session) =>
        (<ChatItem key={value.ID} chat={value} onSelect={setChat}/>)
    )

    const refresh = () => {
        setLoading(true)
        getSessions().then(res => {
            setChatList(res)
            setLoading(false)
        }).catch(err => {
            setError(err)
        })
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
                        {error ? <Typography variant={"caption"}>{error}</Typography> : <CircularProgress/>}
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
