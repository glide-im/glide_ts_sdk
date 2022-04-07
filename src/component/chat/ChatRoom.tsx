import { Send } from "@mui/icons-material";
import { Box, Divider, IconButton, TextareaAutosize, Typography } from "@mui/material";
import React, { CSSProperties, useEffect, useState } from "react";
import { ChatMessage } from "src/im/chat_message";
import { Account } from "../../im/account";
import { GroupMemberList } from "./GroupMemberList";
import { MessageListView } from "./MessageList";

function SessionList() {
    return Account.getInstance().getSessionList();
}

export function ChatRoomContainer(props: { to: string }) {

    const id = parseInt(props.to);
    const session = SessionList().get(id);
    console.log("ChatRoom", props, session)

    const isGroup = (session?.Type === 2)

    if (session == null) {
        return <Box mt={"50%"}>
            <Typography variant="h6" textAlign={"center"}>
                No Session
            </Typography>
        </Box>
    }

    const sendMessage = (msg: string) => {
        if (session != null) {
            session.sendTextMessage(msg)
                .subscribe({
                    next: () => { },
                    error: (err) => {
                        console.error(err)
                    },
                    complete: () => {
                    }
                })
        }
    }

    return (<Box>
        <Box height={"70px"} paddingLeft={"16px"}>
            <Typography variant={"h6"} style={{ lineHeight: "70px" }}>
                {session.Title}
            </Typography>
        </Box>
        <Divider />

        {isGroup && (<Box><GroupMemberList id={session.To} /><Divider /></Box>)}

        <Box height={(isGroup ? "470px" : "510px")}>
            <SessionMessageList id={id} />
        </Box>
        <Divider />

        <Box style={{ height: "100px", padding: "10px" }}>
            <MessageInput onSend={sendMessage} />
        </Box>
    </Box>)
}

function SessionMessageList(props: { id: number }) {
    const session = SessionList().get(props.id);

    const [messages, setMessages] = useState<ChatMessage[]>([]);

    useEffect(() => {
        session?.getMessageHistry(0)
            .subscribe({
                next: (r) => {
                    setMessages(r)
                },
                error: (e) => {
                    console.log("getMessageHistry", e)
                }
            })
    }, [session])

    useEffect(() => {
        session?.setMessageListener((msg) => {
            setMessages([...messages, msg])
        })
        return () => {
            session?.setMessageListener(null)
        }
    }, [session, messages])

    if (session == null) {
        return <Box mt={"50%"}>
            <Typography variant="h6" textAlign={"center"}>
                No Session
            </Typography>
        </Box>
    }
    return <MessageListView messages={session.getMessages()} />
}

const messageInputStyle: CSSProperties = {
    height: "60px", width: "96%", border: "none", outline: "none", resize: "none"
}

function MessageInput(props: { onSend: (msg: string) => void }) {

    const onSend = (msg: string) => {
        const m = msg.trim();
        if (m.length === 0) {
            return
        }
        props.onSend(m)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter") {
            e.preventDefault()
            onSend(e.currentTarget.value)
            e.currentTarget.value = ""
        }
    }

    return <>
        <TextareaAutosize autoFocus style={messageInputStyle} onKeyPress={handleKeyDown} />
        <IconButton color={"primary"} size={"small"} style={{ float: "right" }}>
            <Send />
        </IconButton>
    </>
}
