import {EmojiEmotionsOutlined, ImageOutlined, Send} from "@mui/icons-material";
import {Box, Divider, IconButton, TextareaAutosize, Typography} from "@mui/material";
import {grey} from "@mui/material/colors";
import React, {CSSProperties, useRef} from "react";
import {Account} from "../../im/account";
import {SessionMessageList} from "./MessageList";

function SessionList() {
    return Account.getInstance().getSessionList();
}

export function ChatRoomContainer(props: { sid: string }) {

    const session = SessionList().get(props.sid);

    const isGroup = (session?.Type === 2)

    if (session == null) {
        return <Box mt={"30%"}>
            <Typography variant="h6" textAlign={"center"}>
                没有会话
            </Typography>
        </Box>
    }

    const sendMessage = (msg: string) => {
        if (session != null) {
            session.sendTextMessage(msg)
                .subscribe({
                    next: () => {
                    },
                    error: (err) => {
                        alert(err)
                        // console.error(err)
                    },
                    complete: () => {
                    }
                })
        }
    }

    return (<Box height={"100%"}>
        <Box height={"10%"} paddingLeft={"16px"} color={'black'}>
            <Typography variant={"h6"} style={{lineHeight: "60px"}}>
                {session.Title}
            </Typography>
        </Box>
        <Divider/>

        <Box height={"70%"}>
            {/*<Box height={"10%"}>*/}
            {/*    {isGroup && (<Box><GroupMemberList id={session.To}/><Divider/></Box>)}*/}
            {/*</Box>*/}
            <Box height={"100%"}>
                <SessionMessageList id={props.sid}/>
            </Box>
        </Box>
        <Divider/>

        <Box style={{height: "20%"}}>
            <MessageInput onSend={sendMessage}/>
        </Box>
    </Box>)
}

const messageInputStyle: CSSProperties = {
    width: "96%",
    height: "100%",
    border: "none",
    outline: "none",
    resize: "none",
    backgroundColor: grey[50],
    fontSize: '12pt',
    fontFamily: 'default'
}

function MessageInput(props: { onSend: (msg: string) => void }) {

    const input = useRef<HTMLTextAreaElement>()

    const onSend = (msg: string) => {
        const m = msg.trim();
        if (m.length === 0) {
            return
        }
        props.onSend(m)
    }

    const handleSendClick = () => {
        onSend(input.current.value)
        input.current.value = ''
    }
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter") {
            handleSendClick()
        }
    }
    const handleEmojiClick = () => {
        input.current.value = input.current.value + '😊'
    }
    const handleImageClick = () => {

    }

    return <Box height={'100%'} mr={'8px'} ml={'8px'} position={'relative'}>
        <Box alignItems={'right'} mt={'4px'} height={'20%'}>
            <IconButton onClick={handleImageClick} size={"small"} color={"primary"}>
                <ImageOutlined/>
            </IconButton>
            <IconButton onClick={handleEmojiClick} size={"small"} color={"primary"}>
                <EmojiEmotionsOutlined/>
            </IconButton>
        </Box>

        <Box height={'40%'} mt={'8px'} ml={'4px'} mr={'8px'}>
            <TextareaAutosize ref={input} autoFocus style={messageInputStyle} onKeyPress={handleKeyDown}/>
        </Box>
        <Box height={'15%'}>
            <IconButton onClick={handleSendClick} color={"primary"} size={"small"} style={{float: "right"}}>
                <Send/>
            </IconButton>
        </Box>
    </Box>
}
