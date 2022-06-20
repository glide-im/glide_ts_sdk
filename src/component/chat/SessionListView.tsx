import { Refresh } from "@mui/icons-material";
import { Box, CircularProgress, Divider, IconButton, List, ListItem, ListItemText, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { RouteComponentProps, withRouter } from "react-router-dom";
import { Account } from "src/im/account";
import { Session } from "src/im/session";
import { SessionListItem } from "./SessionListItem";

interface SessionListProps extends RouteComponentProps {
    selected: string,
    onSelect?: (to: string) => void
}

export const SessionListView = withRouter((props: SessionListProps) => {

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
        setCurrentSession(s.To)
        sessionList.currentChatTo = s.To
        props.history.replace(`/im/session/${s.To}`)
        props.onSelect?.(s.To)

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
        const items = sessions?.map((value: Session) =>
            <SessionListItem key={value.To} chat={value} selected={value.To === currentSession} onSelect={onSelect} />
        )

        content = <List style={{ overflow: "auto", height: "100%" }} className="BeautyScrollBar">
            {items}
        </List>
    }

    return <>
        {content}
    </>
});

function Progress(props: { showProgress?: boolean, msg?: string }) {

    return <Box display={"flex"} flexDirection={"column"} paddingTop={"50%"}>
        {props.showProgress !== false ? <CircularProgress style={{ margin: "auto" }} /> : <></>}
        {props.msg ? <Typography variant={"caption"} textAlign={"center"}>{props.msg}</Typography> : <></>}
    </Box>
}
