import {Box, Divider, IconButton, List, ListItem, Typography} from "@mui/material";
import {useEffect, useRef, useState} from "react";
import {Send} from "@mui/icons-material";
import {ChatMessage} from "../im/chat_message";
import {IMChatList} from "../im/ChatList";
import {ChatMessageComp} from "./Message";

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

    const messageListEle = useRef<HTMLUListElement>()
    const [messages, setMessages] = useState(session?.GetAllMessage() ?? [])
    const isGroupChat = (session?.Type === 2)

    useEffect(() => {
        if (session == null) {
            return
        }
        session.setMessageListener((m: ChatMessage) => {
            setMessages([...session.GetAllMessage(), m])
            scrollBottom(messageListEle.current)
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
        if (session && msg.trim().length !== 0) {
            session.sendTextMessage(msg)
                .then((res) => {
                    setMessages([...messages, res])
                    scrollBottom(messageListEle.current)
                })
                .catch((err) => {
                    console.error("send message", err)
                })
        }
    }
    // const memberList = isGroupChat ? <><GroupMemberList chat={props.chat}/> <Divider/></> : <></>

    return (
        <Box>
            <Box height={"70px"} paddingLeft={"16px"}>
                <Typography variant={"h6"} style={{lineHeight: "70px"}}>
                    {session.Title}
                </Typography>
            </Box>
            <Divider/>
            {/*{memberList}*/}
            <Box height={(isGroupChat ? "470px" : "510px")}>
                <List ref={messageListEle} disablePadding style={{overflow: "auto", maxHeight: "100%"}}
                      className={"BeautyScrollBar"}>
                    {
                        messages.flatMap(value =>
                            (<ListItem key={`${value.Mid}`}>
                                <ChatMessageComp msg={value} isGroup={isGroupChat}/>
                            </ListItem>)
                        )
                    }
                </List>
            </Box>
            <Divider/>
            <Box style={{height: "100px", padding: "10px"}}>
                <textarea style={{height: "60px", width: "96%", border: "none", outline: "none", resize: "none"}}
                          onKeyPress={(e) => {
                              if (e.key === "Enter") {
                                  e.preventDefault()
                                  sendMessage(e.currentTarget.value)
                                  e.currentTarget.value = ""
                              }
                          }}/>
                <IconButton color={"primary"} size={"small"} style={{float: "right"}}>
                    <Send/>
                </IconButton>
            </Box>
        </Box>
    )
}

