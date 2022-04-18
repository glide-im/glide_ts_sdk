import { Refresh } from "@mui/icons-material";
import { Avatar, Badge, Box, CircularProgress, Divider, IconButton, List, ListItem, ListItemIcon, ListItemText, Typography } from "@mui/material";
import { green } from "@mui/material/colors";
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

    const [loadSate, setLoadSate] = useState(true)
    const [loadError, setLoadError] = useState("")

    useEffect(() => {
        sessionList.setChatListUpdateListener(r => {
            setSessions(r)
        })
        return () => sessionList.setChatListUpdateListener(null)
    }, [sessionList]);

    useEffect(() => {
        sessionList.getSessions()
            .subscribe({
                next: (res: Session[]) => {
                    setSessions(res)
                },
                error: (err) => {
                    setLoadSate(false)
                    setLoadError(err.toString())
                },
                complete: () => {
                    setLoadSate(false)
                },
            })
    }, [sessionList])

    const onSelect = (s: Session) => {
        setCurrentSession(s.To.toString())
        sessionList.currentSid = s.To.toString()
        props.history.replace(`/im/session/${s.To}`)
    }

    const onRefresh = () => {
        setLoadSate(true)
        sessionList.getSessions()
            .subscribe({
                next: (res: Session[]) => {
                    setSessions(res)
                },
                error: (err) => {
                    console.log(err)
                    setLoadSate(false)
                    setLoadError(err.toString())
                },
                complete: () => {
                    setLoadSate(false)
                },
            })
    }

    let content = <></>

    if (loadSate) {
        content = <Progress showProgress={true} msg={"Loading"} />
    } else if (loadError) {
        content = <Progress showProgress={false} msg={loadError} />
    } else if (sessions.length === 0) {
        content = <Progress showProgress={false} msg={"Empty..."} />
    } else {
        const list = sessions?.map((value: Session) =>
            <SessionListItem key={value.To} chat={value} selected={value.To === parseInt(currentSession)} onSelect={onSelect} />
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
            <Typography variant={"caption"}>会话</Typography>
            <IconButton size={"small"} onClick={onRefresh} style={{ float: "right" }}>
                <Refresh />
            </IconButton>
        </Box>
        <Divider />

        {content}

    </>
});

function Progress(props: { showProgress?: boolean, msg?: string }) {

    return <Box display={"flex"} flexDirection={"column"} paddingTop={"50%"}>
        {props.showProgress !== false ? <CircularProgress style={{ margin: "auto" }} /> : <></>}
        {props.msg ? <Typography variant={"caption"} textAlign={"center"}>{props.msg}</Typography> : <></>}
    </Box>
}

function SessionListItem(props: { chat: Session, selected: boolean, onSelect: (c: Session) => void }) {

    if (props.selected) {
        props.chat.UnreadCount = 0;
    }

    const [chat, setChat] = useState({ obj: props.chat })

    useEffect(() => {
        chat.obj.setSessionUpdateListener(() => {
            console.log("ChatItem", "chat updated")
            if (props.selected) {
                chat.obj.UnreadCount = 0;
            }
            setChat({ obj: chat.obj })
        })
        return () => chat.obj.setSessionUpdateListener(null)
    }, [chat, props.selected])

    const onItemClick = () => {
        props.onSelect(chat.obj)
    }

    let msg = chat.obj.LastMessage
    if (chat.obj.isGroup() || chat.obj.LastMessageSender === 'me') {
        msg = `${chat.obj.LastMessageSender}: ${chat.obj.LastMessage}`
    }

    return <>
        <ListItem button style={{ cursor: "pointer" }} sx={{ bgcolor: 'background.paper' }} onClick={onItemClick} selected={props.selected}>
            <ListItemIcon >
                <Badge badgeContent={chat.obj.UnreadCount} overlap="rectangular" color={"secondary"} >
                    <Avatar variant="rounded" sx={{ bgcolor: green[500] }} src={chat.obj.Avatar} />
                </Badge>
            </ListItemIcon>
            <ListItemText primary={chat.obj.Title} secondary={msg} />
        </ListItem>
    </>
}
