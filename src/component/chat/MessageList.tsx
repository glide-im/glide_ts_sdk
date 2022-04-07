import { Box, List, ListItem, Typography } from "@mui/material";
import React, { CSSProperties, useEffect, useMemo, useRef } from "react";
import { ChatMessage } from "src/im/chat_message";
import { ChatMessageItem } from "./MessageItem";

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

type MessageListItemData = string | ChatMessage

export function MessageListView(props: { messages: ChatMessage[] }) {

    const messages: MessageListItemData[] = useMemo(() => {
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
        return <ListItem key={`${value.Mid}`} sx={{ padding: "0" }}><ChatMessageItem msg={value} /></ListItem>
    })

    return <Box height={"100%"} display={"flex"} alignContent={"flex-end"}>
        <List disablePadding ref={messageListEle} style={messageListStyle} className={"BeautyScrollBar"}>
            {list}
        </List>
    </Box>
}
