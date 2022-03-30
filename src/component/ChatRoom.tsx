import {Box, Divider, IconButton, List, ListItem, TextareaAutosize, Typography} from "@mui/material";
import React, {CSSProperties, useEffect, useRef, useState} from "react";
import {Send} from "@mui/icons-material";
import {ChatMessage} from "../im/chat_message";
import {IMChatList} from "../im/ChatList";
import {ChatMessageComp} from "./Message";
import {GroupMemberList} from "./GroupMemberList";

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

export function ChatRoom(props: { sid: string }) {

    const session = IMChatList.get(props.sid);
    console.log("ChatRoom", props, session)

    const [messages, setMessages] = useState([])
    const isGroupChat = (session?.Type === 2)

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

        {isGroupChat && (<Box><GroupMemberList session={session}/><Divider/></Box>)}

        <Box height={(isGroupChat ? "470px" : "510px")}>
            <MessageList messages={messages}/>
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

const messageListStyle: CSSProperties = {
    overflow: "auto",
    width: "100%",
}

function MessageList(props: { messages: ChatMessage[] }) {

    const messages = props.messages
    const messageListEle = useRef<HTMLUListElement>()

    useEffect(() => {
        // const p = messageListEle.current.scrollTop + messageListEle.current.clientTop

        scrollBottom(messageListEle.current)
    }, [messages])

    return <Box height={"100%"} display={"flex"} alignContent={"flex-end"}>
        <List disablePadding ref={messageListEle} style={messageListStyle} className={"BeautyScrollBar"} >
            {messages.map(value => <ListItem key={`${value.Mid}`}><ChatMessageComp msg={value}/></ListItem>)}
        </List>
    </Box>
}
