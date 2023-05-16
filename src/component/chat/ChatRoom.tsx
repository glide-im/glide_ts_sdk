import {AppBar, Box, Divider, IconButton, Toolbar, Typography} from "@mui/material";
import React, {useEffect, useRef} from "react";
import {Account} from "../../im/account";
import {SessionMessageList} from "./MessageList";
import {showSnack} from "../widget/SnackBar";
import {MessageInput, MessageInputV2} from "./MessageInput";
import {ArrowBack} from "@mui/icons-material";
import {Loading} from "../widget/Loading";
import {RouteComponentProps, useParams, withRouter} from "react-router-dom";
import {ChatContext} from "./context/ChatContext";
import {Event} from "../../im/session_list";
import {filter, map} from "rxjs";

export function ChatRoomContainer() {

    const {sid} = useParams<{ sid: string }>();
    const [session, setSession] = React.useState(null);

    useEffect(() => {
        setSession(Account.session().get(sid))
    }, [sid])

    useEffect(() => {
        if (session === null) {
            const sp = Account.session().event().pipe(
                filter((e) => e.event === Event.create && e.session.ID === sid),
                map((e) => e.session)
            ).subscribe((e) => setSession(e))
            return () => sp.unsubscribe()
        }
    }, [session, sid])

    if (session === null) {
        return <Box mt={"0%"}>
            <Typography variant="h6" textAlign={"center"}>
                选择一个会话开始聊天
            </Typography>
        </Box>
    }

    const sendMessage = (msg: string, type: number) => {
        if (session != null) {
            session.send(msg, type).subscribe({error: (err) => showSnack(err.toString())})
        }
    }

    return (
        <Box className={'xl:h-[95vh] lg:h-[100vh] flex flex-col rounded-br-md rounded-tr-md'} style={{
            backgroundImage: `url(/chat_bg.jpg)`,
            backgroundRepeat: 'repeat',
        }}>
            <Box className={'h-14 pl-6 rounded-tr-md'} color={'black'} bgcolor={"white"}>
                <Typography variant={"h6"} style={{lineHeight: "60px"}}>
                    {session.Title}
                </Typography>
            </Box>
            <Divider/>
            <Box className={'w-full flex-auto'}>
                <div className={'flex flex-col h-full'}>
                    <Box>
                        <SessionMessageList/>
                    </Box>

                    <Box className={'h-16 px-5'}>
                        <MessageInputV2 session={sid} onSend={sendMessage}/>
                    </Box>
                </div>

            </Box>
        </Box>)
}

export const ChatRoomContainerMobile = withRouter((props: RouteComponentProps) => {

    const scrollRef = useRef() as React.MutableRefObject<HTMLDivElement>;
    const {sid} = useParams<{ sid: string }>();
    const session = Account.getInstance().getSessionList().get(sid);

    if (session === null) {
        props.history.replace("/im/session")
        return <Loading/>
    }

    const sendMessage = (msg: string, type: number) => {
        if (session != null) {
            session.send(msg, type).subscribe({error: (err) => showSnack(err.toString())})
        }
    }
    const scrollToBottom = async () => {
        if (scrollRef.current)
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }

    return (<Box height={"100vh"}>
        <AppBar position="static">
            <Toolbar>
                <IconButton edge="start" color="inherit" aria-label="menu" onClick={() => {
                    session.clearUnread()
                    props.history.replace("/im/session")
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
            height={"calc(100vh - 138px)"} style={{
            backgroundImage: `url(/chat_bg.jpg)`,
            backgroundRepeat: 'repeat',
        }} width={'100%'}>
            {/*<Box height={"10%"}>*/}
            {/*    {isGroup && (<Box><GroupMemberList id={session.To}/><Divider/></Box>)}*/}
            {/*</Box>*/}

            <div className={'flex flex-col h-full'}>
                <ChatContext.Provider value={{
                    scrollToBottom,
                }}>
                    <Box height={"calc(95vh - 60px)"} ref={scrollRef}
                         className={'BeautyScrollBar overflow-y-auto flex w-full'}>
                        <SessionMessageList/>
                    </Box>
                </ChatContext.Provider>
            </div>
        </Box>
        <Box height={'80px'} bgcolor={"white"}>
            <MessageInput onSend={sendMessage}/>
        </Box>
    </Box>)
})