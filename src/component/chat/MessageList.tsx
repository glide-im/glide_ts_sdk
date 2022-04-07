import { Avatar, Box, CircularProgress, Grid, List, ListItem, Typography } from "@mui/material";
import React, { CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import { Account } from "src/im/account";
import { ChatMessage, SendingStatus } from "src/im/chat_message";
import { Glide } from "src/im/glide";

function scrollBottom(ele: HTMLUListElement | null) {
    if (ele === null) {
        return
    }
    const from = ele.scrollHeight
    const to = ele.scrollTop
    if (from - to > 400) {
        ele.scrollTop = from + 100
    }
}

const messageListStyle: CSSProperties = {
    overflow: "auto", width: "100%",
}

type MessageListItem = string | ChatMessage

export function MessageListC(props: { messages: ChatMessage[] }) {

    const messages: MessageListItem[] = useMemo(() => {
        return ["", "2022-3-31 08:49", ...props.messages]
    }, [props.messages])

    const messageListEle = useRef<HTMLUListElement>()

    useEffect(() => {
        // const p = messageListEle.current.scrollTop + messageListEle.current.clientTop

        scrollBottom(messageListEle.current)
    }, [])

    const list = messages.map(value => {
        if (typeof value === "string") {
            return <ListItem key={value}>
                <Box width={"100%"}>
                    <Typography key={value} variant={"body2"} textAlign={"center"}>{value}</Typography>
                </Box>
            </ListItem>
        }
        return <ListItem key={`${value.Mid}`} sx={{ padding: "0" }}><ChatMessageC msg={value} /></ListItem>
    })

    return <Box height={"100%"} display={"flex"} alignContent={"flex-end"}>
        <List disablePadding ref={messageListEle} style={messageListStyle} className={"BeautyScrollBar"}>
            {list}
        </List>
    </Box>
}

const messageBoxStyle = function (): CSSProperties {
    return {
        maxWidth: "100%",
        wordWrap: "break-word",
        display: "inline-block",
        padding: "8px 12px",
        borderRadius: "6px"
    }
}

function ChatMessageC(props: { msg: ChatMessage }) {

    const msg = props.msg
    const sender = Glide.getUserInfo(msg.From)
    const me = msg.From === Account.getInstance().getUID()

    const [sending, setSending] = useState(msg.Sending)

    useEffect(() => {
        if (!me) {
            return;
        }
        msg.setUpdateListener(() => {
            setSending(msg.Sending)
        })
        return () => msg.setUpdateListener(null)
    }, [msg, me])

    let name = <></>

    let direction: "row-reverse" | "row" = me ? "row-reverse" : "row"

    if (false) {
        name = <Box style={{ padding: '0px 8px' }}>
            <Typography variant={'caption'} color={'textSecondary'} component={"p"}>
                {msg.From}
            </Typography>
        </Box>
    }

    let status = <></>

    if (me && sending === SendingStatus.Sending) {
        status = <Box display={"flex"} flexDirection={"column-reverse"} height={"100%"}>
            <CircularProgress size={12} />
        </Box>
    }

    return <Grid container direction={direction} padding={"4px 8px"}>
        <Grid item xs={1} justifyContent={"center"}>
            <Avatar style={{ margin: "auto" }} src={sender?.avatar ?? ""} />
        </Grid>
        <Grid item xs={10}>
            {name}
            <Box display={"flex"} flexDirection={direction} height={"100%"}>
                <Box bgcolor={"info.main"} style={messageBoxStyle()}>
                    <Typography variant={"body1"}>{msg.Content}</Typography>
                </Box>
                {status}
            </Box>
        </Grid>
    </Grid>
}
