import {Box, Button, Divider, List, ListItem, Typography} from "@material-ui/core";
import {useEffect, useRef, useState} from "react";
import {ChatMessageComp} from "./Message";
import {Chat, ChatMessage} from "../im/Chat";

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

export function ChatRoom(props: { chat: Chat | null }) {

    console.log("ChatRoom", "enter chat room, ", props.chat?.Cid)
    const messageListEle = useRef<HTMLUListElement>()
    const [messages, setMessages] = useState(() => props.chat === null ? [] : props.chat.getMessage())

    useEffect(() => {
        if (props.chat === null) {
            return
        }
        const onMessage = (m: ChatMessage) => {
            setMessages((messages) => [...messages, m])
            scrollBottom(messageListEle.current)
        }
        props.chat.setMessageListener(onMessage)
        setMessages(() => props.chat.getMessage())
        // return () => client.setChatRoomListener(null, () => null)
    }, [props.chat])

    scrollBottom(messageListEle.current)

    let sendMessage = (msg: string) => {
        if (props.chat === null) {
            return
        }
        if (msg.trim().length === 0) {
            return
        }
        props.chat.sendMessage(msg, () => {
        })
    }

    return (
        <Box>
            <Box height={"70px"} paddingLeft={"16px"}>
                <Typography variant={"h6"}
                            style={{lineHeight: "70px"}}>{props.chat == null ? "" : props.chat.Title}</Typography>
            </Box>
            <Divider/>
            <Box style={{height: "490px"}}>
                <List ref={messageListEle} disablePadding style={{overflow: "auto", maxHeight: "490px"}}
                      className={"BeautyScrollBar"}>
                    {
                        messages.flatMap(value =>
                            (<ListItem key={`${value.Mid}`}>
                                <ChatMessageComp msg={value}/>
                            </ListItem>)
                        )
                    }
                </List>
            </Box>
            <Divider/>
            <Box style={{height: "120px", padding: "10px"}}>
                <textarea style={{height: "80px", width: "96%", border: "none", outline: "none", resize: "none"}}
                          onKeyPress={(e) => {
                              if (e.key === "Enter") {
                                  e.preventDefault()
                                  sendMessage(e.currentTarget.value)
                                  e.currentTarget.value = ""
                              }
                          }}/>
                <Button color={"primary"} size={"small"} variant="outlined" style={{float: "right"}}>Send</Button>
            </Box>
        </Box>
    )
}

