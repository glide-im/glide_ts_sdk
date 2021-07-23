import {Box, Button, Divider, List, ListItem, Typography} from "@material-ui/core";
import {useEffect, useRef, useState} from "react";
import {ws} from "../im/ws";
import {ChatMessage} from "../Model";
import {ChatMessageComp} from "./Message";
import {ActionEcho} from "../im/message";
import {setInterval} from "timers";


const initMsg: ChatMessage[] = []

export function ChatComp(props: { uid: number }) {

    const messageListEle = useRef<HTMLUListElement>(null)
    const [messages, setMessages] = useState(initMsg)

    useEffect(() => {
        ws.connect()
        ws.addMessageListener((data) => {
            let msg: ChatMessage = {
                Avatar: "",
                Message: `${data.Data}`,
                Nickname: "xxx",
                Sender: 0,
                Time: Date.now()
            }

            setMessages((messages) => [...messages, msg])

            // @ts-ignore
            const ele: HTMLUListElement = messageListEle.current
            setInterval(() => {
                const from = ele.scrollHeight
                const to = ele.scrollTop
                if (from - to > 400) {
                    ele.scrollTop = from
                }
            }, 60)
        })
        return ws.close
    }, [])

    let sendMessage = (msg: string) => {
        let m: ChatMessage = {
            Avatar: "",
            Message: msg,
            Nickname: "xxx",
            Sender: -1,
            Time: Date.now()
        }
        setMessages((messages) => [...messages, m])
        ws.sendMessage(ActionEcho, JSON.stringify(m), (success, result, msg1) => {

        })
    }

    return (
        <Box>
            <Box height={"70px"} paddingLeft={"16px"}>
                <Typography variant={"h6"} style={{lineHeight: "70px"}}>Chat: {props.uid}</Typography>
            </Box>
            <Divider/>
            <Box style={{height: "490px"}}>
                <List ref={messageListEle} disablePadding style={{overflow: "auto", maxHeight: "490px"}}
                      className={"BeautyScrollBar"}>
                    {
                        messages.flatMap(value =>
                            (<ListItem key={value.Time}>
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

