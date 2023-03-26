import {AppBar, Box, Divider, Grid, IconButton, TextField, Toolbar, Typography} from "@mui/material";
import React from "react";
import {Account} from "../../im/account";
import {SessionMessageList} from "./MessageList";
import {showSnack} from "../SnackBar";
import {MessageInput} from "./MessageInput";
import {
    ArrowBack,
    EmojiEmotionsOutlined,
    FolderOutlined,
    ImageOutlined,
    KeyboardVoiceOutlined, LocationOnOutlined, Send
} from "@mui/icons-material";
import {MessageType} from "../../im/message";

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

    const sendMessage = (msg: string, type: number) => {
        if (session != null) {
            session.send(msg, type).subscribe({error: (err) => showSnack(err.toString())})
        }
    }

    return (<Box height={"600px"}>
        <Box height={"60px"} paddingLeft={"16px"} color={'black'}>
            <Typography variant={"h6"} style={{lineHeight: "60px"}}>
                {session.Title}
            </Typography>
        </Box>
        <Divider/>

        <Box height={"458px"}>
            {/*<Box height={"10%"}>*/}
            {/*    {isGroup && (<Box><GroupMemberList id={session.To}/><Divider/></Box>)}*/}
            {/*</Box>*/}
            <Box height={'100%'}>
                <SessionMessageList id={props.sid}/>
            </Box>
        </Box>
        <Divider/>

        <Box height={'80px'}>
            <MessageInput onSend={sendMessage}/>
        </Box>
    </Box>)
}

export function ChatRoomContainerMobile(props: { sid: string }) {

    const session = Account.getInstance().getSessionList().get(props.sid);

    if (session == null) {
        return <Box mt={"30%"}>
            <Typography variant="h6" textAlign={"center"}>
                无效会话
            </Typography>
        </Box>
    }

    const sendMessage = (msg: string, type: number) => {
        if (session != null) {
            session.send(msg, type).subscribe({error: (err) => showSnack(err.toString())})
        }
    }

    return (<Box height={"100vh"}>
        <AppBar position="static">
            <Toolbar>
                <IconButton edge="start" color="inherit" aria-label="menu" onClick={()=>{
                    window.history.back()
                }}>
                    <ArrowBack/>
                </IconButton>
                <Typography variant="h6">
                    {session.Title}
                </Typography>
            </Toolbar>
        </AppBar>

        <Box height={"calc(100vh - 138px)"}>
            {/*<Box height={"10%"}>*/}
            {/*    {isGroup && (<Box><GroupMemberList id={session.To}/><Divider/></Box>)}*/}
            {/*</Box>*/}
            <SessionMessageList id={props.sid}/>
        </Box>
        <Box height={'80px'} bgcolor={"white"}>
            <MessageInput onSend={sendMessage}/>
        </Box>
    </Box>)
}