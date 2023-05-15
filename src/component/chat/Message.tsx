import {Audiotrack, ErrorOutline, FileDownload, Map} from "@mui/icons-material";
import {Avatar, Box, CircularProgress, Grid, IconButton, LinearProgress, Typography} from "@mui/material";
import {grey} from "@mui/material/colors";
import React, {CSSProperties, useEffect, useState} from "react";
import {RouteComponentProps, withRouter} from "react-router-dom";
import {Account} from "../../im/account";
import {Cache} from "../../im/cache";
import {ChatMessage, SendingStatus} from "../../im/chat_message";
import {GlideBaseInfo} from "../../im/def";
import {MessageStatus, MessageType} from "../../im/message";
import {ImageViewer} from "../widget/ImageViewer";
import {Markdown} from "../widget/Markdown";
import {ChatContext} from "./context/ChatContext";
import {time2Str} from "../../utils/TimeUtils";

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
    const baseInfo = Cache.getUserInfo(msg.From) ?? {
        name: msg.From,
        id: msg.From,
        avatar: ""
    }
    const [sender, setSender] = useState<GlideBaseInfo>(baseInfo)

    const [sending, setSending] = useState(msg.Sending)

    useEffect(() => {
        if (msg.Type === MessageType.UserOffline || msg.Type === MessageType.UserOnline || msg.Type === 99) {
            return
        }
        if (baseInfo.name !== props.msg.From) {
            return
        }
        console.log('=================', props.msg, props.msg.From)
        const sp = Cache.loadUserInfo1(props.msg.From).subscribe({
            next: (u) => {
                setSender(u)
            }
        })
        return () => sp.unsubscribe()
    }, [props.msg.From])

    useEffect(() => {
        if (!msg.FromMe) {
            return;
        }
        const sp = msg.events().subscribe({
            next: (c) => {
                setSending(c.Sending)
            }
        })
        return () => sp.unsubscribe()
    }, [msg])

    if (msg.Type === MessageType.UserOffline || msg.Type === MessageType.UserOnline || msg.Type === 99) {
        return <Grid container padding={"4px 8px"}>
            <Box width={"100%"} display={"flex"} justifyContent={"center"}>
                <Typography variant={"body2"} textAlign={"center"} px={1}
                            sx={{background: grey[100], borderRadius: "50px"}}>
                    {msg.getDisplayContent()}
                </Typography>
            </Box>
        </Grid>
    }

    let direction: "row-reverse" | "row" = msg.FromMe ? "row-reverse" : "row"

    let status = <></>

    if (msg.FromMe && sending === SendingStatus.Sending) {
        status = <Box display={"flex"} flexDirection={"column-reverse"} height={"100%"}>
            <CircularProgress size={12}/>
        </Box>
    }

    return <Grid container direction={direction} px={0} py={1}>

        {/* Avatar */}
        <Grid item xs={2} md={1}>
            <UserAvatar ui={sender}/>
        </Grid>

        {/* Content */}
        <Grid item xs={9} md={10} color={'palette.primary.main'}>

            {/* NickName */}
            {msg.FromMe ? <></> : <Box>
                <Typography className={'font-sans'} variant={'body1'} color={'textPrimary'} component={"span"}>
                    {sender.name}
                </Typography>
                <Typography className={'font-sans'} variant={"caption"} ml={1} component={"span"} color={grey[500]}>
                    {time2Str(msg.SendAt)}
                </Typography>
            </Box>}

            {/* Message */}
            <Box display={"flex"} flexDirection={direction} mt={msg.FromMe ? 0 : 1}>

                <Box bgcolor={"white"} style={messageBoxStyle()}>
                    <MessageContent msg={msg}/>
                </Box>
                {status}
            </Box>
        </Grid>
    </Grid>
}


interface Props extends RouteComponentProps {
    ui: GlideBaseInfo;
    onClick?: (id: number) => void
}

const UserAvatar = withRouter((props: Props) => {

    const isSelf = props.ui.id === Account.getInstance().getUID();
    const handleClick = () => {
        if (isSelf) {
            return
        }
        Account.getInstance().getSessionList().createSession(props.ui.id).subscribe((ses) => {
            Account.session().setSelectedSession(ses.ID)
            props.history.replace(`/im/session/${ses.ID}`);
        })
    }

    return <>
        <Avatar onClick={handleClick} sx={{
            margin: "auto", cursor: isSelf ? 'default' : 'pointer', bgcolor: grey[400]
        }} src={props.ui.avatar}/>
    </>
})

// function AtUser(props: { uid: string }) {
//     const ui = Cache.getUserInfo(props.uid)
//     if (ui) {
//         return <>{ui.name}</>
//     }
//     return <>{props.uid}</>
// }

function MessageContent(props: { msg: ChatMessage }) {
    const chatContext = React.useContext(ChatContext)
    const [open, setOpen] = useState(false);
    const [content, setContent] = useState(props.msg.getDisplayContent())
    const [status, setStatus] = useState(props.msg.Status)

    useEffect(() => {
        const sp = props.msg.events().subscribe({
            next: (c) => {
                setContent(c.getDisplayContent())
                setStatus(c.Status)
                setTimeout(() => {
                    chatContext.scrollToBottom()
                }, 500)
            }
        })
        return () => sp.unsubscribe()
    }, [chatContext, props.msg])


    switch (props.msg.Type) {
        case MessageType.Image:
            return <>
                <ImageViewer imageUrl={props.msg.Content} onClose={() => {
                    setOpen(false)
                }} open={open}/>
                <img src={props.msg.Content} alt={props.msg.Content} width={'100%'} onClick={() => {
                    setOpen(true)
                }}/>
            </>
        case MessageType.StreamMarkdown:
        case MessageType.StreamText:
            switch (status) {
                case MessageStatus.StreamStart:
                    return <CircularProgress/>
                case MessageStatus.StreamSending:
                    return <Box width={'100%'}>
                        <Markdown source={content}/>
                        <LinearProgress/>
                    </Box>
                case MessageStatus.StreamCancel:
                    return <Box display={"flex"} justifyContent={"center"} alignItems={"center"}>
                        <ErrorOutline/><Typography ml={1} variant={"body2"}>{content}</Typography>
                    </Box>
                case MessageStatus.StreamFinish:
                    return <Box width={'100%'}><Markdown source={content}/></Box>
                default:
                    return <Markdown source={content}/>
            }
        case MessageType.Markdown:
            return <Markdown source={content}/>
        case MessageType.Text:
            return <Typography variant={"body1"} className={'font-light'}>{content}</Typography>
        case MessageType.Audio:
            return <Box display={"flex"} justifyContent={'center'} alignItems={'center'}>
                <IconButton color={'info'} title={'语音消息'}><Audiotrack/></IconButton>
                <Typography variant={"body2"} color={'#5dccce'}>语音消息</Typography>
            </Box>
        case MessageType.Location:
            return <Box display={"flex"} justifyContent={'center'} alignItems={'center'}>
                <IconButton color={'info'} title={'语音消息'}><Map/></IconButton>
                <Typography variant={"body2"} color={'#5dccce'}>位置</Typography>
            </Box>
        case MessageType.File:
            return <Box display={"flex"} justifyContent={'center'} alignItems={'center'}>
                <IconButton color={'info'} title={'文件消息'}><FileDownload/></IconButton>
                <Typography variant={"body2"} color={'#5dccce'}>文件</Typography>
            </Box>
        default:
            return <Typography variant={"body1"} color={'#444'}>{props.msg.Content}</Typography>
    }
}