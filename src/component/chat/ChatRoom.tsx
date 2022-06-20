import { Send } from "@mui/icons-material";
import { Box, Divider, IconButton, TextareaAutosize, Typography } from "@mui/material";
import { grey } from "@mui/material/colors";
import React, { CSSProperties } from "react";
import { Account } from "../../im/account";
import { GroupMemberList } from "./GroupMemberList";
import { SessionMessageList } from "./MessageList";

function SessionList() {
    return Account.getInstance().getSessionList();
}

export function ChatRoomContainer(props: { to: string }) {

    const id = props.to;
    const session = SessionList().get(id);

    const isGroup = (session?.Type === 2)

    if (session == null) {
        return <Box mt={"50%"}>
            <Typography variant="h6" textAlign={"center"}>
                No Session
            </Typography>
        </Box>
    }

    const sendMessage = (msg: string) => {
        if (session != null) {
            session.sendTextMessage(msg)
                .subscribe({
                    next: () => { },
                    error: (err) => {
                        alert(err)
                        // console.error(err)
                    },
                    complete: () => {
                    }
                })
        }
    }

    return (<Box height={"100"}>
        <Box height={"70px"} paddingLeft={"16px"} color={'black'}>
            <Typography variant={"h6"} style={{ lineHeight: "70px" }}>
                {session.Title}
            </Typography>
        </Box>
        <Divider />

        {isGroup && (<Box><GroupMemberList id={session.To} /><Divider /></Box>)}

        <Box height={"400px"}>
            <SessionMessageList id={id} />
        </Box>
        <Divider />

        <Box style={{ height: "100px", padding: "10px" }}>
            <MessageInput onSend={sendMessage} />
        </Box>
    </Box>)
}

const messageInputStyle: CSSProperties = {
    height: "60px", width: "96%", border: "none", outline: "none", resize: "none", backgroundColor: grey[50], fontFamily: 'default'
}

function MessageInput(props: { onSend: (msg: string) => void }) {

    const onSend = (msg: string) => {
        const m = msg.trim();
        if (m.length === 0) {
            return
        }
        props.onSend(m)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter") {
            e.preventDefault()
            onSend(e.currentTarget.value)
            e.currentTarget.value = ""
        }
    }

    return <>
        <TextareaAutosize autoFocus style={messageInputStyle} onKeyPress={handleKeyDown} />
        <IconButton color={"primary"} size={"small"} style={{ float: "right" }}>
            <Send />
        </IconButton>
    </>
}
