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
import {client} from "../im/client";

const emptySession: Session[] = [];

function getSessions(): Promise<Session[]> {
    return client.chatList.getSessions()
        .then(sessions => {
            console.log("getSessions", sessions);
            return sessions;
        })
}

export function ChatList() {

    const [sessions, setSessions] = useState(emptySession)
    const [selectedSid, setSelectedSid] = useState(null)

    const [loading, setLoading] = useState(true)
    const [msg, setMsg] = useState(null)

    // const { sid }  = useParams()
    // console.log(sid)

    const update = function () {
        setLoading(true)
        getSessions()
            .then(res => {
                if (res.length === 0) {
                    setMsg("Empty")
                }
                setSessions(res)
                setLoading(false)
            })
            .catch(err => {
                setMsg(err)
                setLoading(false)
            })
    }

    useEffect(() => {
        update()
    }, [])

    const refresh = () => {
        update()
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
                {
                    loading ? <Progress/> :
                        msg ? <Progress showProgress={false} msg={msg}/> : <SessionList sessions={sessions} onSelect={setSelectedSid}/>
                }
            </Grid>
            <Grid item md={8} style={{height: "700px"}}>
                <Divider orientation={"vertical"} style={{float: "left"}}/>
                <ChatRoom sid={selectedSid}/>
            </Grid>
        </Grid>

    </Box>
}

function SessionList(props: { sessions: Session[], onSelect?: (sid: string) => void }) {

    const [selectedSid, setSelectedSid] = useState("")

    const list = props.sessions.flatMap((value: Session) =>
        (<ChatItem key={value.ID} chat={value} selected={value.ID === selectedSid} onSelect={(s) => {
            setSelectedSid(s.ID)
            props.onSelect && props.onSelect(s.ID)
        }}/>)
    )

    return <>
        <List style={{overflow: "auto"}}>
            {list}
            <ListItem>
                <ListItemText primary={" "}/>
            </ListItem>
        </List>
    </>
}

function Progress(props: { showProgress?: boolean, msg?: string }) {

    return <Box sx={{display: "flex", justifyContent: "center", paddingTop: "50%"}}>
        {props.showProgress !== false ? <CircularProgress/> : <></>}
        {props.msg ? <Typography variant={"caption"}>{props.msg}</Typography> : <></>}
    </Box>
}
