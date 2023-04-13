import {Box, List, ListItem, Typography} from "@mui/material";
import React, {CSSProperties, useEffect, useRef, useState} from "react";
import {ChatMessageItem} from "./Message";
import {ChatMessage} from "../../im/chat_message";
import {SessionList} from "../../im/session_list";
import {ChatContext} from "./context/ChatContext";
import {useParams} from "react-router-dom";
import {Session} from "../../im/session";

export function SessionMessageList() {

    const {sid} = useParams<{ sid: string }>();
    const [session, setSession] = React.useState<Session | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>(session?.getMessages() ?? []);

    useEffect(() => {
        setSession(SessionList.getInstance().get(sid))
    }, [sid])


    useEffect(() => {
        if (session === null) {
            return
        }
        setMessages(session.getMessages())
        const sp = session.messageObservable().subscribe((msg) => {
            setMessages([...session.getMessages()])
        })
        return () => sp.unsubscribe()
    }, [session])

    if (sid === "1") {
        // loadHistory()
    }

    if (session == null) {
        return <Box mt={"50%"}>
            <Typography variant="h6" textAlign={"center"}>
                选择一个回话开始聊天
            </Typography>
        </Box>
    }

    // if (loading) {
    //     return <Box height={"100%"} display={"flex"} flexDirection={"column"}>
    //         <CircularProgress style={{ margin: "30% auto 0px auto" }} />
    //         <Typography variant="h6" textAlign={"center"}>
    //             Loading...
    //         </Typography>
    //     </Box>
    // }

    return <MessageListView messages={messages} isGroup={session.isGroup()}/>
}

const messageListStyle: CSSProperties = {
    overflow: "revert", width: "100%",
}

// type MessageListItemData = string | ChatMessage

function MessageListView(props: { messages: ChatMessage[], isGroup: boolean }) {
    const chatContext = React.useContext(ChatContext)
    // TODO use useMemo
    // const messages: MessageListItemData[] = useMemo(() => {
    //     return ["", ...props.messages]
    // }, [props.messages])

    const messages = props.messages
    console.log(">>>>>render message list",messages)

    const messageListEle = useRef<HTMLUListElement>()

    useEffect(() => {
        chatContext.scrollToBottom()
    }, [chatContext])

    const list = messages.map(value => {
        if (typeof value === "string") {
            return <ListItem key={value}>
                <Box width={"100%"}>
                    <Typography key={value} variant={"body2"} textAlign={"center"}>{value}</Typography>
                </Box>
            </ListItem>
        }
        return <ListItem key={value.getId()} sx={{padding: "0"}}><ChatMessageItem msg={value}/></ListItem>
    })

    return <Box className={'w-full'} display={"flex"} alignContent={"flex-end"}>
        <List disablePadding ref={messageListEle} style={messageListStyle}>
            {list}
        </List>
    </Box>
}


