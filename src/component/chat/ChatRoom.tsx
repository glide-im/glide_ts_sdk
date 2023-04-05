import {AppBar, Box, Container, Divider, IconButton, Toolbar, Typography} from "@mui/material";
import React from "react";
import {Account} from "../../im/account";
import {SessionMessageList} from "./MessageList";
import {showSnack} from "../SnackBar";
import {MessageInput, MessageInputV2} from "./MessageInput";
import {ArrowBack} from "@mui/icons-material";
import {Loading} from "../Loading";
import {useParams} from "react-router-dom";

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

    return (<Box height={"100vh"}>
        <Box height={"60px"} paddingLeft={"16px"} color={'black'}>
            <Typography variant={"h6"} style={{lineHeight: "60px"}}>
                {session.Title}
            </Typography>
        </Box>
        <Divider/>
        <Box style={{
            backgroundImage: `url(chat_bg.jpg)`,
            backgroundRepeat: 'repeat',
        }} width={'100%'}>
            <Container maxWidth={'lg'}>
                <Box height={"calc(100vh - 60px - 82px)"}>
                    {/*<Box height={"10%"}>*/}
                    {/*    {isGroup && (<Box><GroupMemberList id={session.To}/><Divider/></Box>)}*/}
                    {/*</Box>*/}
                    <Box height={'100%'}>
                        <SessionMessageList id={props.sid}/>
                    </Box>
                </Box>

                <Box height={'80px'}>
                    <MessageInputV2 onSend={sendMessage}/>
                </Box>
            </Container>

        </Box>
    </Box>)
}

export function ChatRoomContainerMobile() {

    const {sid} = useParams<{ sid: string }>();
    const session = Account.getInstance().getSessionList().get(sid);

    if (session === null) {
        window.location.href = "/im/session"
        return <Loading/>
    }

    const sendMessage = (msg: string, type: number) => {
        if (session != null) {
            session.send(msg, type).subscribe({error: (err) => showSnack(err.toString())})
        }
    }

    return (<Box height={"100vh"}>
        <AppBar position="static">
            <Toolbar>
                <IconButton edge="start" color="inherit" aria-label="menu" onClick={() => {
                    session.clearUnread()
                    window.history.back()
                }}>
                    <ArrowBack/>
                </IconButton>
                <Typography variant="h6">
                    {session?.Title ?? "-"}
                </Typography>
            </Toolbar>
        </AppBar>

        <Box height={"calc(100vh - 138px)"}  style={{
            backgroundImage: `url(chat_bg.jpg)`,
            backgroundRepeat: 'repeat',
        }} width={'100%'}>
            {/*<Box height={"10%"}>*/}
            {/*    {isGroup && (<Box><GroupMemberList id={session.To}/><Divider/></Box>)}*/}
            {/*</Box>*/}
            <SessionMessageList id={sid} />
        </Box>
        <Box height={'80px'} bgcolor={"white"}>
            <MessageInput onSend={sendMessage}/>
        </Box>
    </Box>)
}