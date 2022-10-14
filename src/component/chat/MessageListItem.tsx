import {Avatar, Box, CircularProgress, Grid, IconButton, Typography} from "@mui/material"
import React, {CSSProperties, useEffect, useState} from "react"
import {Account} from "src/im/account"
import {ChatMessage, SendingStatus} from "src/im/chat_message"
import {IMUserInfo} from "src/im/def"
import {Cache} from "src/im/cache"
import {RouteComponentProps, withRouter} from "react-router-dom";
import {MessageType} from "../../im/message";
import {Audiotrack, FileDownload, Map} from "@mui/icons-material";

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
    let sender: IMUserInfo = Cache.getUserInfo(msg.From)

    const [sending, setSending] = useState(msg.Sending)

    if (sender === null) {
        sender = {
            avatar: "", name: msg.From, uid: msg.From
        }
    }

    useEffect(() => {
        if (!msg.IsMe) {
            return;
        }
        msg.setUpdateListener(() => {
            setSending(msg.Sending)
        })
        return () => msg.setUpdateListener(null)
    }, [msg])

    let name = <></>

    if (msg.Type === 100 || msg.Type === 101 || msg.Type === 99) {
        return <Grid container padding={"4px 8px"}>
            <Box width={"100%"}>
                <Typography variant={"body2"} textAlign={"center"}>
                    {msg.getDisplayContent()}
                </Typography>
            </Box>
        </Grid>
    }

    let direction: "row-reverse" | "row" = msg.IsMe ? "row-reverse" : "row"

    if (!msg.IsMe) {
        name = <Box style={{padding: '0px 8px'}}>
            <Typography variant={'caption'} color={'textSecondary'} component={"p"}>
                {sender.name}
            </Typography>
        </Box>
    }

    let status = <></>

    if (msg.IsMe && sending === SendingStatus.Sending) {
        status = <Box display={"flex"} flexDirection={"column-reverse"} height={"100%"}>
            <CircularProgress size={12}/>
        </Box>
    }

    let msgContent: JSX.Element
    switch (msg.Type) {
        case MessageType.Image:
            msgContent = <img src={msg.Content} alt={msg.Content}/>
            break;
        case MessageType.Text:
            msgContent = <Typography variant={"body1"} color={'#444'}>{msg.Content}</Typography>
            break;
        case MessageType.Audio:
            msgContent = <Box display={"flex"} justifyContent={'center'} alignItems={'center'}>
                <IconButton color={'info'} title={'语音消息'}>
                    <Audiotrack/>
                </IconButton>
                <Typography variant={"body2"} color={'#5dccce'}>语音消息</Typography>
            </Box>
            break;
        case MessageType.Location:
            msgContent = <Box display={"flex"} justifyContent={'center'} alignItems={'center'}>
                <IconButton color={'info'} title={'语音消息'}>
                    <Map/>
                </IconButton>
                <Typography variant={"body2"} color={'#5dccce'}>位置</Typography>
            </Box>
            break;
        case MessageType.File:
            msgContent = <Box display={"flex"} justifyContent={'center'} alignItems={'center'}>
                <IconButton color={'info'} title={'语音消息'}>
                    <FileDownload/>
                </IconButton>
                <Typography variant={"body2"} color={'#5dccce'}>文件</Typography>
            </Box>
            break;
        default:
            msgContent = <Typography variant={"body1"} color={'#444'}>{msg.Content}</Typography>
            break;
    }

    return <Grid container direction={direction} padding={"4px 8px"}>
        <Grid item xs={1} justifyContent={"center"}>
            <AvatarComp ui={sender}/>
        </Grid>
        <Grid item xs={10}>
            {name}
            <Box display={"flex"} flexDirection={direction}>
                <Box bgcolor={"white"} style={messageBoxStyle()}>
                    {msgContent}
                </Box>
                {status}
            </Box>
        </Grid>
    </Grid>
}


interface Props extends RouteComponentProps {
    ui: IMUserInfo;
    onClick?: (id: number) => void
}

const AvatarComp = withRouter((props: Props) => {

    const isSelf = props.ui.uid === Account.getInstance().getUID();
    const handleClick = () => {
        if (isSelf) {
            return
        }
        Account.getInstance().getSessionList().createSession(props.ui.uid).then((ses) => {
            props.history.push(`/im/session/${ses.ID}`);
        })
    }

    return <>
        <Avatar onClick={handleClick} style={{margin: "auto", cursor: isSelf ? 'default' : 'pointer'}}
                src={props.ui.avatar}/>
    </>
})