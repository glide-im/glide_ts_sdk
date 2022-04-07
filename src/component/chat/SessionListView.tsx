import { Refresh } from "@mui/icons-material";
import { Avatar, Box, CircularProgress, Divider, IconButton, List, ListItem, ListItemIcon, ListItemText, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { RouteComponentProps, withRouter } from "react-router-dom";
import { Account } from "src/im/account";
import { Session } from "src/im/session";

interface SessionListProps extends RouteComponentProps {
    selected: string,
    onSelect?: (sid: string) => void
}

export const SessionListView = withRouter((props: SessionListProps) => {

    console.log("SessionList", props.selected)
    const sessionList = Account.getInstance().getSessionList();

    const [currentSession, setCurrentSession] = useState(props.selected)
    const [sessions, setSessions] = useState(sessionList.getSessionsTemped());

    const [loadSate, setLoadSate] = useState({
        loading: true,
        msg: null
    })

    useEffect(() => {
        sessionList.setChatListUpdateListener(r => {
            setSessions(r)
        })
        return () => sessionList.setChatListUpdateListener(null)
    }, [sessionList]);

    useEffect(() => {
        if (sessions.length === 0) {
            sessionList.getSessions()
                .subscribe({
                    next: (res: Session[]) => {
                        const s = {
                            loading: false,
                            msg: null
                        }
                        if (res.length === 0) {
                            s.msg = "Empty"
                        }
                        setSessions(res)
                        setLoadSate(s)
                    },
                    error: (err) => {
                        setLoadSate({
                            loading: false,
                            msg: err
                        })
                    },
                })
        } else {
            setLoadSate({
                loading: false,
                msg: null
            })
        }
    }, [sessionList, sessions])


    const onSelect = (s: Session) => {
        setCurrentSession(s.To.toString())
        sessionList.currentSid = s.To.toString()
        props.history.replace(`/im/session/${s.To}`)
    }

    const onRefresh = () => {

    }

    let content = <></>

    if (loadSate.loading) {
        content = <Progress showProgress={true} msg={"Loading"} />
    } else {
        const list = sessions?.map((value: Session) =>
            <ChatItem key={value.To} chat={value} selected={value.To === parseInt(currentSession)} onSelect={onSelect} />
        )

        content = <List style={{ overflow: "auto" }}>
            {list}
            <ListItem>
                <ListItemText primary={" "} />
            </ListItem>
        </List>
    }

    return <>
        <Box m={2}>
            <Typography variant={"caption"}>Messages</Typography>
            <IconButton size={"small"} onClick={onRefresh} style={{ float: "right" }}>
                <Refresh />
            </IconButton>
        </Box>
        <Divider />

        {content}

    </>
});

function Progress(props: { showProgress?: boolean, msg?: string }) {

    return <Box sx={{ display: "flex", justifyContent: "center", flexDirection: "column", alignContent: "center", paddingTop: "50%" }}>
        {props.showProgress !== false ? <CircularProgress /> : <></>}
        {props.msg ? <Typography variant={"caption"}>{props.msg}</Typography> : <></>}
    </Box>
}

function ChatItem(props: { chat: Session, selected: boolean, onSelect: (c: Session) => void }) {

    const [chat, setChat] = useState({ obj: props.chat })

    useEffect(() => {
        chat.obj.setSessionUpdateListener(() => {
            console.log("ChatItem", "chat updated")
            setChat({ obj: chat.obj })
        })
        return () => chat.obj.setSessionUpdateListener(null)
    }, [chat])

    const onItemClick = () => {
        // const c = client.chatList.get(chat.ID)
        // client.chatList.setCurrentChat(c, onChatUpdate, onChatMessage)
        props.onSelect(chat.obj)
    }

    return <div key={chat.obj.ID}>
        <ListItem button style={{ cursor: "pointer" }}
            onClick={onItemClick} selected={props.selected}>
            <ListItemIcon>
                <Avatar src={""} />
            </ListItemIcon>
            <ListItemText primary={!chat.obj.Title ? "-" : chat.obj.Title} secondary={"-"} />
        </ListItem>
    </div>
}
