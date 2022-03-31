import {
    Avatar,
    Box,
    CircularProgress,
    Divider,
    Grid,
    IconButton,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Typography
} from "@mui/material";
import React, {useEffect, useState} from "react";
import {ChatRoom} from "./ChatRoom";
import {Refresh} from "@mui/icons-material";
import {Session} from "../im/session";
import {RouteComponentProps, useParams, withRouter} from "react-router-dom";
import {IMAccount} from "../im/account";

const emptySession: Session[] = [];

export function Chat() {

    const {sid} = useParams<{ sid: string }>();

    const [sessions, setSessions] = useState(emptySession)
    const [loadSate, setLoadSate] = useState({
        loading: true,
        msg: null
    })

    const update = function () {

        IMAccount.getSessionList().setChatListUpdateListener(function (list: Session[]) {
            setSessions(list)
        })

        IMAccount.getSessionList().getSessions()
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
                    msg: err.toString()
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
            <Grid item xs={4} style={{height: "700px"}}>
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
            <Grid item xs={8} style={{height: "700px"}}>
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
    IMAccount.getSessionList().currentSid = props.selected;
    const onSelect = (s: Session) => {
        setSelectedSid(s.ID)
        IMAccount.getSessionList().currentSid = s.ID
        props.history.replace(`/im/session/${s.ID}`)
    }
    const list = props.sessions.map((value: Session) =>
        <ChatItem key={value.ID} chat={value} selected={value.ID === selectedSid} onSelect={onSelect}/>
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

function ChatItem(props: { chat: Session, selected: boolean, onSelect: (c: Session) => void }) {

    const [chat, setChat] = useState({obj: props.chat})

    useEffect(() => {
        chat.obj.setUpdateListener(c => {
            console.log("ChatItem", "chat updated")
            setChat({obj: c})
        })
        return () => chat.obj.setUpdateListener(() => null)
    }, [chat])

    const onItemClick = () => {
        // const c = client.chatList.get(chat.ID)
        // client.chatList.setCurrentChat(c, onChatUpdate, onChatMessage)
        props.onSelect(chat.obj)
    }

    return <div key={chat.obj.ID}>
        <ListItem button style={{cursor: "pointer"}}
                  onClick={onItemClick} selected={props.selected}>
            <ListItemIcon>
                <Avatar src={""}/>
            </ListItemIcon>
            <ListItemText primary={!chat.obj.Title ? "-" : chat.obj.Title} secondary={"-"}/>
        </ListItem>
    </div>
}
