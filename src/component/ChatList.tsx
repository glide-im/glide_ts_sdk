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
import {IMChatList} from "../im/ChatList";
import {RouteComponentProps, useParams, withRouter} from "react-router-dom";

const emptySession: Session[] = [];

export function ChatList() {

    const {sid} = useParams<{ sid: string }>();

    const [sessions, setSessions] = useState(emptySession)

    const [loadSate, setLoadSate] = useState(
        {
            loading: true,
            msg: null
        })

    const update = function () {

        IMChatList.setChatListUpdateListener(function (list: Session[]) {
            setSessions(list)
        })

        IMChatList.getSessions()
            .then(res => {
                const s = {
                    loading: false,
                    msg: null
                }
                if (res.length === 0) {
                    s.msg = "Empty"
                }
                setSessions(res)
                setLoadSate(s)
            })
            .catch(err => {
                setLoadSate({
                    loading: false,
                    msg: err
                })
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
                    loadSate.loading ? <Progress/> :
                        loadSate.msg ? <Progress showProgress={false} msg={loadSate.msg}/> :
                            <SessionList selected={sid} sessions={sessions}/>
                }
            </Grid>
            <Grid item md={8} style={{height: "700px"}}>
                <Divider orientation={"vertical"} style={{float: "left"}}/>
                <ChatRoom sid={sid}/>
            </Grid>
        </Grid>

    </Box>
}

interface SessionListProps extends RouteComponentProps {
    selected: string,
    sessions: Session[],
    onSelect?: (sid: string) => void
}

export const SessionList = withRouter((props: SessionListProps) => {

    const [selectedSid, setSelectedSid] = useState(props.selected)
    IMChatList.currentSid = props.selected;
    const onSelect = (s: Session) => {
        setSelectedSid(s.ID)
        IMChatList.currentSid = s.ID
        props.history.replace(`/im/session/${s.ID}`)
    }

    const list = props.sessions.flatMap((value: Session) =>
        (<ChatItem key={value.ID} chat={value} selected={value.ID === selectedSid} onSelect={onSelect}/>)
    )

    return <>
        <List style={{overflow: "auto"}}>
            {list}
            <ListItem>
                <ListItemText primary={" "}/>
            </ListItem>
        </List>
    </>
});

function Progress(props: { showProgress?: boolean, msg?: string }) {

    return <Box sx={{display: "flex", justifyContent: "center", paddingTop: "50%"}}>
        {props.showProgress !== false ? <CircularProgress/> : <></>}
        {props.msg ? <Typography variant={"caption"}>{props.msg}</Typography> : <></>}
    </Box>
}
