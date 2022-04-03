import React, { CSSProperties, useEffect, useMemo, useRef } from "react";
import { ChatMessage } from "../im/chat_message";
import { Avatar, Box, Grid, List, ListItem, Typography } from "@mui/material";
import { Glide } from "../im/glide";
import { Account } from "src/im/account";
import { Message } from "src/im/message";

function scrollBottom(ele: HTMLUListElement | null) {
    if (ele == null) {
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

type MessageListItem = string | Message

export function MessageListC(props: { messages: Message[] }) {

    const messages: MessageListItem[] = useMemo(() => {
        return ["", "2022-3-31 08:49", ...props.messages]
    }, [props.messages])

    const messageListEle = useRef<HTMLUListElement>()

    useEffect(() => {
        // const p = messageListEle.current.scrollTop + messageListEle.current.clientTop

        scrollBottom(messageListEle.current)
    }, [messages])

    const list = messages.map(value => {
        if (typeof value === "string") {
            return <ListItem>
                <Box width={"100%"}>
                    <Typography key={value} variant={"body2"} textAlign={"center"}>{value}</Typography>
                </Box>
            </ListItem>
        }
        return <ListItem key={`${value.mid}`} sx={{ padding: "0" }}><ChatMessageC msg={value} /></ListItem>
    })

    return <Box height={"100%"} display={"flex"} alignContent={"flex-end"}>
        <List disablePadding ref={messageListEle} style={messageListStyle} className={"BeautyScrollBar"}>
            {list}
        </List>
    </Box>
}

const messageBoxStyle = function (): CSSProperties {
    return {
        maxWidth: "90%",
        wordWrap: "break-word",
        display: "inline-block",
        padding: "8px 12px",
        textAlign: "center",
        borderRadius: "6px"
    }
}

function ChatMessageC(props: { msg: Message }) {

    const msg = props.msg
    const sender = Glide.getUserInfo(msg.from)
    const me = msg.from === Account.getInstance().getUID()

    let name = <></>

    let direction: "row-reverse" | "row" = "row-reverse"
    let avatar = <></>

    if (!me) {
        direction = "row"
        avatar = <Grid item xs={1} justifyContent={"center"}>
            <Avatar src={sender?.avatar ?? ""} />
        </Grid>

    }

    if (!me) {
        name = <Box style={{ padding: '0px 8px' }}>
            <Typography variant={'caption'} color={'textSecondary'} component={"p"}>
                {msg.from}
            </Typography>
        </Box>
    }

    return <Grid container direction={direction} padding={"4px 16px"}>
        {avatar}
        <Grid item style={{}}>
            {name}
            <Box bgcolor={"info.main"} style={messageBoxStyle()}>
                <Typography variant={"body1"}>{msg.content}</Typography>
            </Box>
        </Grid>
    </Grid>
}
