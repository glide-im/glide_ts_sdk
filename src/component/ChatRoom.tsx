import {Box, Divider, IconButton, TextareaAutosize, Typography} from "@mui/material";
import React, {CSSProperties, useEffect, useState} from "react";
import {Send} from "@mui/icons-material";
import {ChatMessage} from "../im/chat_message";
import {IMChatList} from "../im/chat_list";
import {GroupMemberList} from "./GroupMemberList";
import {MessageListC} from "./MessageList";

export function ChatRoom(props: { sid: string }) {

    const session = IMChatList.get(props.sid);
    console.log("ChatRoom", props, session)

    const [messages, setMessages] = useState([])
    const isGroup = (session?.Type === 2)

    useEffect(() => {
        if (session == null) {
            return
        }
        setMessages(session.getMessages())

        session.setMessageListener((m: ChatMessage) => {
            setMessages([...session.getMessages()])
        })
        return () => session.setMessageListener(null)
    }, [session])

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
                .then((res) => {
                    setMessages([...messages, res])
                })
                .catch((err) => {
                    console.error("send message", err)
                })
        }
    }

    return (<Box>
        <Box height={"70px"} paddingLeft={"16px"}>
            <Typography variant={"h6"} style={{lineHeight: "70px"}}>
                {session.Title}
            </Typography>
        </Box>
        <Divider/>

        {isGroup && (<Box><GroupMemberList id={session.To}/><Divider/></Box>)}

        <Box height={(isGroup ? "470px" : "510px")}>
            <MessageListC messages={messages}/>
        </Box>
        <Divider/>

        <Box style={{height: "100px", padding: "10px"}}>
            <MessageInput onSend={sendMessage}/>
        </Box>
    </Box>)
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
        <TextareaAutosize autoFocus style={messageInputStyle} onKeyPress={handleKeyDown}/>
        <IconButton color={"primary"} size={"small"} style={{float: "right"}}>
            <Send/>
        </IconButton>
    </>
}
