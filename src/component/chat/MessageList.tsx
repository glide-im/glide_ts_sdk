import { Box, List, ListItem, Typography } from "@mui/material";
import React, { CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import { ChatMessageItem } from "./Message";
import { Account } from "../../im/account";
import { ChatMessage } from "../../im/chat_message";
import { SessionList } from "../../im/session_list";
import {ChatContext} from "./context/ChatContext";

interface MessageListProps {
    id: string
}

export function SessionMessageList(props: MessageListProps) {

    const session = SessionList.getInstance().get(props.id);

    const [messages, setMessages] = useState<ChatMessage[]>([]);

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
        if (session === null) {
            return;
        }
        const l = session.addMessageListener((msg) => {
            console.log('MessageList on new message', session)
            setMessages([...session.getMessages()])
        })
        return () => l()
    }, [session])

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
                选择一个回话开始聊天
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

    return <MessageListView messages={messages} isGroup={session.isGroup()} />
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
    overflow: "revert", width: "100%",
}

type MessageListItemData = string | ChatMessage

function MessageListView(props: { messages: ChatMessage[], isGroup: boolean }) {
    const chatContext = React.useContext(ChatContext)
    const messages: MessageListItemData[] = useMemo(() => {
        return ["", ...props.messages]
    }, [props.messages])

    const messageListEle = useRef<HTMLUListElement>()

    useEffect(() => {
        chatContext.scrollToBottom()
    }, [messages])

    const list = messages.map(value => {
        if (typeof value === "string") {
            return <ListItem key={value}>
                <Box width={"100%"}>
                    <Typography key={value} variant={"body2"} textAlign={"center"}>{value}</Typography>
                </Box>
            </ListItem>
        }
        return <ListItem key={`${value.SendAt}`} sx={{ padding: "0" }}><ChatMessageItem msg={value} /></ListItem>
    })

    return <Box className={'w-full'} display={"flex"} alignContent={"flex-end"}>
        <List disablePadding ref={messageListEle} style={messageListStyle} >
            {list}
        </List>
    </Box>
}


