import {
    EmojiEmotionsOutlined,
    FolderOutlined,
    ImageOutlined,
    KeyboardVoiceOutlined,
    LocationOnOutlined,
    Send
} from "@mui/icons-material";
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    FormControl,
    IconButton,
    InputLabel,
    MenuItem,
    Select,
    TextareaAutosize,
    Typography
} from "@mui/material";
import {grey} from "@mui/material/colors";
import React, {CSSProperties, useRef, useState} from "react";
import {Account} from "../../im/account";
import {SessionMessageList} from "./MessageList";
import {MessageType} from "../../im/message";

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
            session.send(msg, type).subscribe({error: (err) => alert(err)})
        }
    }

    return (<Box height={"100%"}>
        <Box height={"10%"} paddingLeft={"16px"} color={'black'}>
            <Typography variant={"h6"} style={{lineHeight: "60px"}}>
                {session.Title}
            </Typography>
        </Box>
        <Divider/>

        <Box height={"65%"}>
            {/*<Box height={"10%"}>*/}
            {/*    {isGroup && (<Box><GroupMemberList id={session.To}/><Divider/></Box>)}*/}
            {/*</Box>*/}
            <Box height={"100%"}>
                <SessionMessageList id={props.sid}/>
            </Box>
        </Box>
        <Divider/>

        <Box style={{height: "25%"}}>
            <MessageInput onSend={sendMessage}/>
        </Box>
    </Box>)
}

const messageInputStyle: CSSProperties = {
    width: "96%",
    height: "100%",
    border: "none",
    outline: "none",
    resize: "none",
    backgroundColor: grey[100],
    fontSize: '12pt',
    fontFamily: 'MS-yahei, Arial, Helvetica, sans-serif'
}

function MessageInput(props: { onSend: (msg: string, type: number) => void }) {

    const input = useRef<HTMLTextAreaElement>()
    const [showImageDialog, setShowImageDialog] = useState(false)

    const onSend = (msg: string) => {
        const m = msg.trim();
        if (m.length === 0) {
            return
        }
        props.onSend(m, MessageType.Text)
    }

    const handleSendClick = () => {
        onSend(input.current.value)
        input.current.value = ''
    }
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter") {
            handleSendClick()
        }
    }
    const handleEmojiClick = () => {
        input.current.value = input.current.value + '😊'
    }
    const handleImageClick = () => {
        setShowImageDialog(true)
    }

    return <Box height={'100%'} mr={'8px'} ml={'8px'} position={'relative'}>
        <SendImageDialog open={showImageDialog} callback={(url) => {
            if (url.startsWith('http') && url.length > 7) {
                props.onSend(url, MessageType.Image)
            }
            setShowImageDialog(false)
        }}/>
        <Box alignItems={'right'} mt={'4px'} height={'20%'}>
            <IconButton onClick={handleImageClick} size={"small"} color={"primary"}>
                <ImageOutlined/>
            </IconButton>
            <IconButton onClick={handleEmojiClick} size={"small"} color={"primary"}>
                <EmojiEmotionsOutlined/>
            </IconButton>
            <IconButton size={"small"} color={"primary"} onClick={() => props.onSend("", MessageType.File)}>
                <FolderOutlined/>
            </IconButton>
            <IconButton size={"small"} color={"primary"} onClick={() => props.onSend("", MessageType.Audio)}>
                <KeyboardVoiceOutlined/>
            </IconButton>
            <IconButton size={"small"} color={"primary"} onClick={() => props.onSend("", MessageType.Location)}>
                <LocationOnOutlined/>
            </IconButton>
        </Box>

        <Box height={'40%'} mt={'8px'} ml={'4px'} mr={'8px'}>
            <TextareaAutosize ref={input} autoFocus style={messageInputStyle} onKeyPress={handleKeyDown}/>
        </Box>
        <Box height={'15%'}>
            <IconButton onClick={handleSendClick} color={"primary"} size={"small"} style={{float: "right"}}>
                <Send/>
            </IconButton>
        </Box>
    </Box>
}

function SendImageDialog(props: { open: boolean, callback: (url: string) => void }) {

    const input = useRef<HTMLInputElement>()

    return <Box>
        <Dialog fullWidth open={props.open} onClose={() => {
            props.callback('')
        }} aria-labelledby="form-dialog-title">
            <DialogTitle id="form-dialog-title">发送图片</DialogTitle>
            <DialogContent>
                {/*<TextField inputRef={input} autoFocus margin="dense" id="text" label="图片 URL"*/}
                {/*           type="text"*/}
                {/*           fullWidth defaultValue={'https://www.baidu.com/img/flexible/logo/pc/result.png'}/>*/}
                <Box></Box>
                <FormControl fullWidth>
                    <InputLabel id="demo-simple-select-label">选择图片</InputLabel>
                    <Select inputRef={input} onChange={(v) => {
                    }}>
                        <MenuItem value={'https://www.baidu.com/img/flexible/logo/pc/result.png'}>图片 1</MenuItem>
                        <MenuItem
                            value={'https://dlweb.sogoucdn.com/pcsearch/web/index/images/logo_300x116_e497c82.png'}>图片
                            2</MenuItem>
                        <MenuItem value={'http://inews.gtimg.com/newsapp_bt/0/12171811596_909/0'}>图片 3</MenuItem>
                        <MenuItem
                            value={'http://lf3-cdn-tos.bytescm.com/obj/static/xitu_juejin_web/e08da34488b114bd4c665ba2fa520a31.svg'}>图片
                            4</MenuItem>
                        <MenuItem value={'https://i0.sinaimg.cn/home/2014/1030/hxjzg103.jpg'}>图片 5</MenuItem>
                    </Select>
                </FormControl>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => {
                    console.log(input.current)
                    props.callback(input.current.value)
                }} color="primary">
                    发送
                </Button>
            </DialogActions>
        </Dialog>
    </Box>
}
