import {Box, Button, Divider, List, ListItem, Typography} from "@material-ui/core";
import {useEffect, useRef, useState} from "react";
import {ChatMessage} from "../Model";
import {ChatMessageComp} from "./Message";
import {Chat} from "../im/message";
import {setInterval} from "timers";
import {client} from "../im/client";

export function ChatComp(props: { chat: Chat | null }) {

    const cid = props.chat !== null ? props.chat.Cid : -1
    const messageListEle = useRef<HTMLUListElement>(null)
    const [messages, setMessages] = useState(client.getChatMessage(cid))

    useEffect(() => {

        if (props.chat === null) {
            return
        }
        const onMessage = (m: ChatMessage) => {
            setMessages((messages) => [...messages, m])

            // @ts-ignore
            const ele: HTMLUListElement = messageListEle.current
            setInterval(() => {
                if (ele == null) {
                    return
                }
                const from = ele.scrollHeight
                const to = ele.scrollTop
                if (from - to > 400) {
                    ele.scrollTop = from
                }
            }, 100)
        }

        client.setChatRoomListener(props.chat.Cid, onMessage)

        return () => client.setChatRoomListener(-1, () => null)
    }, [props.chat])

    let sendMessage = (msg: string) => {
        if (props.chat === null) {
            return
        }
        let m: ChatMessage = {
            Mid: 0, ChatId: props.chat?.Cid, Message: msg, MessageType: 1, SendAt: "", Sender: -1
        }
        setMessages((messages) => [...messages, m])
        client.sendChatMessage(props.chat.UcId, props.chat.Target, msg)
    }

    return (
        <Box>
            <Box height={"70px"} paddingLeft={"16px"}>
                <Typography variant={"h6"}
                            style={{lineHeight: "70px"}}>Chat: {props.chat == null ? "" : props.chat.Target}</Typography>
            </Box>
            <Divider/>
            <Box style={{height: "490px"}}>
                <List ref={messageListEle} disablePadding style={{overflow: "auto", maxHeight: "490px"}}
                      className={"BeautyScrollBar"}>
                    {
                        messages.flatMap(value =>
                            (<ListItem key={`${value.Mid}-${Date.now()}`}>
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

