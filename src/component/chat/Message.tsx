import {
    Audiotrack,
    CheckOutlined,
    DoneAllOutlined,
    ErrorOutline,
    FileDownload,
    HelpOutlined,
    Map
} from "@mui/icons-material";
import {
    Avatar,
    Box,
    Button,
    CircularProgress,
    Grid,
    IconButton,
    LinearProgress,
    Paper,
    Tooltip,
    Typography
} from "@mui/material";
import {grey} from "@mui/material/colors";
import React, {useEffect, useMemo, useRef, useState} from "react";
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
import {filter, Observable} from "rxjs";
import {MessagePopup} from "./MessagePopup";
import {SxProps} from "@mui/system";
import {Theme} from "@mui/material/styles";
import {Logger} from "../../utils/Logger";

const messageBoxStyleLeft: SxProps<Theme> = {
    overflow: 'visible',
    borderRadius: '12px',
    filter: 'drop-shadow(0px 2px 2px rgba(0,0,0,0.32))',
    '&:before': {
        content: '""',
        display: 'block',
        position: 'absolute',
        top: 10,
        left: -4,
        width: 12,
        height: 8,
        bgcolor: 'background.paper',
        transform: 'translateY(-50%) rotate(70deg)',
        zIndex: 0,
    }
}

const messageBoxStyleRight: SxProps<Theme> = {
    overflow: 'visible',
    borderRadius: '12px',
    filter: 'drop-shadow(0px 2px 2px rgba(0,0,0,0.32))',
    '&:before': {
        content: '""',
        display: 'block',
        position: 'absolute',
        top: 10,
        right: -4,
        width: 12,
        height: 8,
        bgcolor: 'background.paper',
        transform: 'translateY(-50%) rotate(-70deg)',
        zIndex: 0,
    }
}


export function ChatMessageItem(props: { msg: ChatMessage }) {

    const msg = props.msg

    const baseInfo: GlideBaseInfo = useMemo(() => {
        return Cache.getUserInfo(msg.From) ?? {
            name: msg.From,
            id: msg.From,
            avatar: "",
            isChannel: false
        } as GlideBaseInfo
    }, [msg.From])

    const [sender, setSender] = useState<GlideBaseInfo>(baseInfo)

    useEffect(() => {
        if (msg.Type === MessageType.UserOffline || msg.Type === MessageType.UserOnline) {
            return
        }
        if (baseInfo.name !== msg.From) {
            return
        }
        const sp = Cache.loadUserInfo1(msg.From).subscribe({
            next: (u) => {
                setSender(u)
            }
        })
        return () => sp.unsubscribe()
    }, [msg.From, msg.Type, baseInfo])

    if (msg.Type === MessageType.UserOffline || msg.Type === MessageType.UserOnline) {
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

    return <MessagePopup msg={msg}>
        <Grid container direction={direction} px={0} py={1}>
            {/* Avatar */}
            <Grid item>
                <Box px={2} pt={1}>
                    <UserAvatar ui={sender}/>
                </Box>
            </Grid>

            {/* Content */}
            <Grid item xs={9} md={10} color={'palette.primary.main'}>
                <MessageHeader sender={sender} message={msg}/>
                {/* Message */}
                <Box display={"flex"} flexDirection={direction} mt={msg.FromMe ? 1 : 0}>
                    <Paper elevation={0} sx={msg.FromMe ? messageBoxStyleRight : messageBoxStyleLeft}>
                        <Box px={2} py={1}>
                            <MessageContent msg={msg}/>
                        </Box>
                    </Paper>
                    <Box>
                        <MessageStatusView message={msg}/>
                    </Box>
                </Box>
            </Grid>
        </Grid>
    </MessagePopup>
}

const sendStatusHint = {
    [SendingStatus.Unknown]: "未知状态",
    [SendingStatus.Sending]: "发送中",
    [SendingStatus.ServerAck]: "服务器已收到",
    [SendingStatus.ClientAck]: "接收者已收到",
    [SendingStatus.Failed]: "发送失败",
}

function MessageStatusView(props: { message: ChatMessage }) {

    if (!props.message.FromMe) {
        return <></>
    }
    if (props.message.IsGroup && props.message.Sending === SendingStatus.ServerAck) {
        return <></>
    }

    let status = <></>
    let hint = sendStatusHint[props.message.Sending]

    switch (props.message.Sending) {
        case SendingStatus.Unknown:
            status = <HelpOutlined fontSize={'small'} color={'disabled'}/>
            break
        case SendingStatus.Sending:
            status = <CircularProgress size={12}/>
            break
        case SendingStatus.ServerAck:
            status = <CheckOutlined fontSize={'small'} color={"success"}/>
            break
        case SendingStatus.ClientAck:
            status = <DoneAllOutlined fontSize={'small'} color={"success"}/>
            break
        case SendingStatus.Failed:
            hint += `(${props.message.FailedReason ?? ""})`
            status = <ErrorOutline fontSize={'small'} color={"error"}/>
            break
    }

    return <Box display={"flex"} flexDirection={"column-reverse"} height={"100%"} px={1}>
        <Tooltip title={hint}>
            {status}
        </Tooltip>
    </Box>
}

function MessageHeader(props: { sender: GlideBaseInfo, message: ChatMessage }) {

    if (props.message.FromMe) {
        return <></>
    }

    const sendAt = time2Str(props.message.SendAt)
    const updateAt = time2Str(props.message.UpdateAt)

    let update = <></>
    if (sendAt !== updateAt && props.message.UpdateAt !== 0 && updateAt !== "") {
        update = <Typography className={'font-sans'} variant={"caption"} ml={1} component={"span"} color={grey[500]}>
            更新于{updateAt}
        </Typography>
    }

    return <Box>
        <Typography className={'font-sans'} variant={'body2'} color={grey[700]} component={"span"}>
            {props.sender.name}
        </Typography>
        <Typography className={'font-sans'} variant={"caption"} ml={1} component={"span"} color={grey[500]}>
            {sendAt}
        </Typography>
        {update}
    </Box>

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

const atUserRegex = /@[0-9A-Za-z_]{5,20}/g

function At(props: { id: string }) {
    const [name, setName] = useState(Cache.getUserInfo(props.id)?.name ?? props.id)
    useEffect(() => {
        if (name !== props.id) {
            return
        }
        const sp = Cache.loadUserInfo1(props.id).subscribe((info) => {
            setName(info.name)
        })
        return () => sp.unsubscribe()
    })
    return <Button sx={{borderRadius: '16px', textTransform: 'none', padding: '0px 4px'}}
                   size={"small"}
                   autoCapitalize={null}
                   variant={"text"}>
        @{name}
    </Button>
}

function MessageContent(props: { msg: ChatMessage }) {

    const chatContext = React.useContext(ChatContext)
    const [open, setOpen] = useState(false);
    const [content, setContent] = useState(props.msg.getDisplayContent())
    const [status, setStatus] = useState(props.msg.Status)
    const [cnt, setCnt] = useState<Array<string | JSX.Element>>([content])

    useEffect(() => {
        const sp = Account.session().get(props.msg.SID)?.event.pipe(
            filter((e) => e.message?.getId() === props.msg.getId()),
        ).subscribe({
            next: (c) => {
                const msg = c.message as ChatMessage
                setContent(msg.getDisplayContent())
                setStatus(msg.Status)
                setTimeout(() => {
                    chatContext.scrollToBottom()
                }, 500)
            }
        })
        return () => sp?.unsubscribe()
    }, [props.msg, chatContext])

    useEffect(() => {
        if (props.msg.Type !== MessageType.Text) {
            return
        }
        const sp = new Observable<Array<string | JSX.Element>>((subscriber) => {
            const result = new Array<string | JSX.Element>()
            const parts = content.split(atUserRegex)
            atUserRegex[Symbol.match](content)?.forEach((match, i) => {
                if (!match.startsWith('@')) {
                    return
                }
                const node = <At key={match} id={match.replace('@', '')}/>
                result.push(node)
                result.push(parts[i + 1])
            })
            subscriber.next(result.length > 0 ? result : [content])
            subscriber.complete()
        }).subscribe({
            next: (n) => {
                setCnt(n)
            },
            error: (e) => {
                Logger.error("MessageContent", "error on resolve `@`", e)
            }
        })
        return () => sp.unsubscribe()
    }, [content, props.msg.Type])


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
            return <Typography variant={"body1"} className={'font-light'}>
                {cnt}
            </Typography>
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
            return <Typography variant={"body1"} color={'#444'}>{content}</Typography>
    }
}