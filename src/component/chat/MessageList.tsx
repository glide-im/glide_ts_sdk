import {Box, List, ListItem, Typography} from "@mui/material";
import React, {CSSProperties, useEffect, useMemo, useRef, useState} from "react";
import {Account} from "src/im/account";
import {ChatMessage} from "src/im/chat_message";
import {IMUserInfo} from "src/im/def";
import {ChatMessageItem} from "./MessageItem";

export function SessionMessageList(props: { id: string }) {

    const session = Account.getInstance().getSessionList().get(props.id);

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    console.log("SessionMessageList", session)

    useEffect(() => {

        session?.getMessageHistory(0)
            .subscribe({
                next: (r) => {
                    setMessages(r)
                },
                error: (e) => {
                    console.log("getMessageHistory", e)
                },
                complete: () => {
                }
            })

        if (session === null) {
            return
        }
        const msgs = session.getMessages()
        setMessages(msgs)
    }, [session])

    useEffect(() => {
        session?.setMessageListener((msg) => {
            setMessages([...session.getMessages()])
        })
        return () => {
            session?.setMessageListener(null)
        }
    }, [session, messages])

    const loadHistory = () => {
        session?.getMessageHistory(0)
            .subscribe({
                next: (r) => {
                    setMessages(r)
                },
                error: (e) => {
                    console.log("getMessageHistry", e)
                },
                complete: () => {
                }
            })
    }

    if (props.id === "1") {
        // loadHistory()
    }

    if (session == null) {
        return <Box mt={"50%"}>
            <Typography variant="h6" textAlign={"center"}>
                No Session
            </Typography>
        </Box>
    }

    // if (loading) {
    //     return <Box height={"100%"} display={"flex"} flexDirection={"column"}>
    //         <CircularProgress style={{ margin: "30% auto 0px auto" }} />
    //         <Typography variant="h6" textAlign={"center"}>
    //             Loading...
    //         </Typography>
    //     </Box>
    // }

    return <MessageListView messages={messages} isGroup={session.isGroup()} userInfo={session.getUserInfo()}/>
}

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

export function MessageListView(props: { messages: ChatMessage[], isGroup: boolean, userInfo?: IMUserInfo }) {

    const messages: MessageListItemData[] = useMemo(() => {
        return ["", "2022-3-31 08:49", ...props.messages]
    }, [props.messages])

    const messageListEle = useRef<HTMLUListElement>()

    useEffect(() => {
        // const p = messageListEle.current.scrollTop + messageListEle.current.clientTop

        scrollBottom(messageListEle.current)
    }, [messages])

    const list = messages.map(value => {
        if (typeof value === "string") {
            return <ListItem key={value}>
                <Box width={"100%"}>
                    <Typography key={value} variant={"body2"} textAlign={"center"}>{value}</Typography>
                </Box>
            </ListItem>
        }
        return <ListItem key={`${value.Mid}`} sx={{padding: "0"}}><ChatMessageItem msg={value}
                                                                                   userInfo={props.userInfo}/></ListItem>
    })

    return <Box height={"100%"} display={"flex"} alignContent={"flex-end"}>
        <List disablePadding ref={messageListEle} style={messageListStyle} className={"BeautyScrollBar"}>
            {list}
        </List>
    </Box>
}


