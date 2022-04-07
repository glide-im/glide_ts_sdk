import { Box, Typography, CircularProgress, Grid, Avatar } from "@mui/material"
import { CSSProperties, useEffect, useState } from "react"
import { Account } from "src/im/account"
import { ChatMessage, SendingStatus } from "src/im/chat_message"
import { Glide } from "src/im/glide"

const messageBoxStyle = function (): CSSProperties {
    return {
        maxWidth: "100%",
        wordWrap: "break-word",
        display: "inline-block",
        padding: "8px 12px",
        borderRadius: "6px"
    }
}

export function ChatMessageItem(props: { msg: ChatMessage }) {

    const msg = props.msg
    const sender = Glide.getUserInfo(msg.From)
    const me = msg.From === Account.getInstance().getUID()

    const [sending, setSending] = useState(msg.Sending)

    useEffect(() => {
        if (!me) {
            return;
        }
        msg.setUpdateListener(() => {
            setSending(msg.Sending)
        })
        return () => msg.setUpdateListener(null)
    }, [msg, me])

    let name = <></>

    let direction: "row-reverse" | "row" = me ? "row-reverse" : "row"

    if (false) {
        name = <Box style={{ padding: '0px 8px' }}>
            <Typography variant={'caption'} color={'textSecondary'} component={"p"}>
                {msg.From}
            </Typography>
        </Box>
    }

    let status = <></>

    if (me && sending === SendingStatus.Sending) {
        status = <Box display={"flex"} flexDirection={"column-reverse"} height={"100%"}>
            <CircularProgress size={12} />
        </Box>
    }

    return <Grid container direction={direction} padding={"4px 8px"}>
        <Grid item xs={1} justifyContent={"center"}>
            <Avatar style={{ margin: "auto" }} src={sender?.avatar ?? ""} />
        </Grid>
        <Grid item xs={10}>
            {name}
            <Box display={"flex"} flexDirection={direction} height={"100%"}>
                <Box bgcolor={"info.main"} style={messageBoxStyle()}>
                    <Typography variant={"body1"}>{msg.Content}</Typography>
                </Box>
                {status}
            </Box>
        </Grid>
    </Grid>
}
