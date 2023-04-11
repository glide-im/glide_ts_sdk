import {AppBar, Box, Container, Divider, IconButton, Toolbar, Typography} from "@mui/material";
import React, {useRef} from "react";
import {Account} from "../../im/account";
import {SessionMessageList} from "./MessageList";
import {showSnack} from "../widget/SnackBar";
import {MessageInput, MessageInputV2} from "./MessageInput";
import {ArrowBack} from "@mui/icons-material";
import {Loading} from "../widget/Loading";
import {useParams} from "react-router-dom";
import {ChatContext} from "./context/ChatContext";


function SessionList() {
    return Account.getInstance().getSessionList();
}



export function ChatRoomContainer() {
    const scrollRef = useRef() as React.MutableRefObject<HTMLDivElement>;

    const {sid} = useParams<{ sid: string }>();

    const session = SessionList().get(sid);

    const isGroup = (session?.Type === 2)

    if (session == null) {
        return <Box mt={"30%"}>
            <Typography variant="h6" textAlign={"center"}>
                没有会话
            </Typography>
        </Box>
    }
    const scrollToBottom = async () => {
        if (scrollRef.current)
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }

    const sendMessage = (msg: string, type: number) => {
        if (session != null) {
            session.send(msg, type).subscribe({error: (err) => showSnack(err.toString())})
        }
    }

    return (<Box className={'h-[95vh] flex flex-col '}>
        <Box className={'h-14 pl-6'} color={'black'}>
            <Typography variant={"h6"} style={{lineHeight: "60px"}}>
                {session.Title}
            </Typography>
        </Box>
        <Divider/>
        <Box style={{
            backgroundImage: `url(/chat_bg.jpg)`,
            backgroundRepeat: 'repeat',
        }} className={'w-full flex-auto flex-1'}>
            <div className={'flex flex-col h-full'}>
                <ChatContext.Provider value={{
                    scrollToBottom,
                }}>
                    <Box height={"calc(95vh - 60px - 60px)"} ref={scrollRef} className={'BeautyScrollBar overflow-y-auto flex w-full'}>
                        <SessionMessageList id={sid}/>
                    </Box>

                    <Box className={'h-16 px-5'}>
                        <MessageInputV2 onSend={sendMessage}/>
                    </Box>
                </ChatContext.Provider>
            </div>

        </Box>
    </Box>)
}

export function ChatRoomContainerMobile() {

    const scrollRef = useRef() as React.MutableRefObject<HTMLDivElement>;
    const {sid} = useParams<{ sid: string }>();
    const session = Account.getInstance().getSessionList().get(sid);

    const scrollToBottom = async () => {
        if (scrollRef.current)
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }

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

        <Box
            ref={scrollRef}
            height={"calc(100vh - 138px)"}  style={{
            backgroundImage: `url(/chat_bg.jpg)`,
            backgroundRepeat: 'repeat',
        }} width={'100%'}>
            {/*<Box height={"10%"}>*/}
            {/*    {isGroup && (<Box><GroupMemberList id={session.To}/><Divider/></Box>)}*/}
            {/*</Box>*/}
            <SessionMessageList id={sid}/>
        </Box>
        <Box height={'80px'} bgcolor={"white"}>
            <MessageInput onSend={sendMessage}/>
        </Box>
    </Box>)
}