import {Avatar, Box, CircularProgress, Grid, IconButton, Typography} from "@mui/material"
import React, {CSSProperties, useEffect, useState} from "react"
import {Account} from "src/im/account"
import {ChatMessage, SendingStatus} from "src/im/chat_message"
import {IMUserInfo} from "src/im/def"
import {Cache} from "src/im/cache"
import {RouteComponentProps, withRouter} from "react-router-dom";
import {MessageType} from "../../im/message";
import {Audiotrack, FileDownload, Map} from "@mui/icons-material";
import {ImageViewer} from "../ImageViewer";
import {Markdown} from "../Markdown";
import {grey} from "@mui/material/colors";

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
            <Box width={"100%"} display={"flex"} justifyContent={"center"}>
                <Typography variant={"body2"} textAlign={"center"} px={1} component={'span'}
                            sx={{background: grey[100], borderRadius: "50px"}}>
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


    return <Grid container direction={direction} px={0} py={1}>
        <Grid item xs={2} md={1}>
            <UserAvatar ui={sender}/>
        </Grid>
        <Grid item xs={9} md={10} color={'palette.primary.main'}>
            <Typography variant={"body1"}>{name}</Typography>
            <Box display={"flex"} flexDirection={direction}>
                <Box bgcolor={"white"} style={messageBoxStyle()}>
                    <MessageContent msg={msg}/>
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

const UserAvatar = withRouter((props: Props) => {

    const isSelf = props.ui.uid === Account.getInstance().getUID();
    const handleClick = () => {
        if (isSelf) {
            return
        }
        Account.getInstance().getSessionList().createSession(props.ui.uid).subscribe((ses) => {
            props.history.push(`/im/session/${ses.ID}`);
        })
    }

    return <>
        <Avatar onClick={handleClick} sx={{
            margin: "auto", cursor: isSelf ? 'default' : 'pointer', bgcolor: grey[400]
        }} src={props.ui.avatar}/>
    </>
})


function MessageContent(props: { msg: ChatMessage }) {

    const [open, setOpen] = useState(false);

    let msgContent: JSX.Element
    switch (props.msg.Type) {
        case MessageType.Image:
            msgContent = <>
                <ImageViewer imageUrl={props.msg.Content} onClose={() => {
                    setOpen(false)
                }} open={open}/>
                <img src={props.msg.Content} alt={props.msg.Content} width={'100%'} onClick={() => {
                    setOpen(true)
                }}/>
            </>
            break;
        case MessageType.Markdown:
            msgContent = <Markdown source={props.msg.Content}/>
            break;
        case MessageType.Text:
            msgContent = <Typography variant={"body1"} color={'#444'}>{props.msg.Content}</Typography>
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
            msgContent = <Typography variant={"body1"} color={'#444'}>{props.msg.Content}</Typography>
            break;
    }

    return msgContent;
}