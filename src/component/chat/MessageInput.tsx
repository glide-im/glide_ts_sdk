import React, {useRef, useState} from "react";
import {MessageType} from "../../im/message";
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    Grid,
    IconButton,
    InputBase,
    InputLabel,
    MenuItem,
    Paper,
    Popover,
    Select,
} from "@mui/material";
import {
    AttachFileRounded,
    EmojiEmotionsOutlined,
    EmojiEmotionsRounded,
    FolderOutlined,
    ImageOutlined,
    KeyboardVoiceOutlined,
    Send,
    SendRounded
} from "@mui/icons-material";
import {grey} from "@mui/material/colors";
import VideoChat from "../webrtc/VideoChatDialog";


export function MessageInput(props: { onSend: (msg: string, type: number) => void }) {

    const input = useRef<HTMLInputElement>(null)
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
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && e.shiftKey) {
            e.preventDefault();
            return;
        }

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

    return <>
        <Box>
            <SendImageDialog open={showImageDialog} callback={(url) => {
                if (url.startsWith('http') && url.length > 7) {
                    props.onSend(url, MessageType.Image)
                }
                setShowImageDialog(false)
            }}/>
            <Box>
                <IconButton onClick={handleImageClick} size={"small"} color={"primary"} disabled={true}>
                    <ImageOutlined/>
                </IconButton>
                <IconButton onClick={handleEmojiClick} size={"small"} color={"primary"} disabled={true}>
                    <EmojiEmotionsOutlined/>
                </IconButton>
                <IconButton size={"small"} color={"primary"} onClick={() => props.onSend("", MessageType.File)}
                            disabled={true}>
                    <FolderOutlined/>
                </IconButton>
                <IconButton size={"small"} color={"primary"} onClick={() => props.onSend("", MessageType.Audio)}
                            disabled={true}>
                    <KeyboardVoiceOutlined/>
                </IconButton>
            </Box>

            <Box pr={1} pl={1}>
                <Grid container spacing={2}>
                    <Grid item xs={10}>
                        <InputBase fullWidth inputRef={input} autoComplete={"off"}
                                   onKeyDown={handleKeyDown}/>
                    </Grid>
                    <Grid item xs={2}>
                        {/*<VideoChat incoming={null}/>*/}
                        <IconButton onClick={handleSendClick} color={"primary"} style={{float: "right"}}>
                            <Send/>
                        </IconButton>
                    </Grid>
                </Grid>
            </Box>
        </Box>
    </>

}

export function MessageInputV2(props: { session: string, onSend: (msg: string, type: number) => void }) {

    const input = useRef<HTMLInputElement>(null)

    const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null);
    const [open, setOpen] = React.useState(false);

    const onSend = (msg: string) => {
        const m = msg.trim();
        if (m.length === 0) {
            return
        }
        props.onSend(m, MessageType.Text)
    }

    const onEmojiClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
        setOpen(!open);
    };

    const handleSendClick = () => {
        onSend(input.current.value)
        input.current.value = ''
    }

    const onAttachFileClick = () => {

    }
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && e.shiftKey) {
            e.preventDefault();
            return;
        }

        if (e.key === "Enter") {
            handleSendClick()
        }
    }
    return <Grid container>
        <Grid item md={11} sm={10} xs={9}>
            <Paper sx={{ display: 'flex', alignItems: 'center', width: '100%', borderRadius: '100px'}}>
                <Popover onClose={() => setOpen(false)} id={'id1'} anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }} anchorEl={anchorEl} transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                }} open={open}>
                    <EmojiList onclick={(e) => {
                        input.current.value = input.current.value + e
                        setOpen(false)
                    }}/>
                </Popover>
                <IconButton aria-describedby={'id1'} sx={{p: '10px'}} onClick={onEmojiClick}>
                    <EmojiEmotionsRounded/>
                </IconButton>
                <InputBase inputRef={input}
                           className={'border-0'}
                           autoComplete={"off"}
                           size={"medium"}
                           sx={{ml: 1, flex: 1, fontFamily: 'MS-YaHei',}} fullWidth
                           placeholder="说点什么"
                           onKeyDown={handleKeyDown}
                           inputProps={{'aria-label': 'search google maps'}}/>
                <VideoChat session={props.session} showIcon={true}/>
                <IconButton aria-describedby={'id1'} sx={{p: '10px'}} onClick={onAttachFileClick}>
                    <AttachFileRounded/>
                </IconButton>
            </Paper>
        </Grid>
        <Grid item md={1} sm={2} xs={3} justifyContent="center" alignItems="center" display={"flex"}>
            <Box sx={{bgcolor: grey[50], borderRadius: '100px'}}>
                <IconButton color={'primary'}  sx={{p: '10px'}} size={"large"} onClick={handleSendClick}>
                    <SendRounded/>
                </IconButton>
            </Box>
        </Grid>
    </Grid>
}

function SendImageDialog(props: { open: boolean, callback: (url: string) => void }) {

    const input = useRef<HTMLInputElement>()

    return <Box>
        <Dialog fullWidth open={props.open} onClose={() => {
            props.callback('')
        }} aria-labelledby="form-dialog-title">
            <DialogTitle id="form-dialog-title">发送图片</DialogTitle>
            <DialogContent>
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

const emojis = [
    '😀', '😁', '😂', '🤣', '😃', '😄', '😅', '😆', '😉', '😊',
    '😋', '😎', '😍', '😘', '😗', '😙', '😚', '🙂', '🤗', '🤔',
    '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥',
];

function EmojiList(props: { onclick: (emoji: string) => void }) {


    return (
        <Box>
            <Grid container p={1}>
                {emojis.map((emoji) => (
                    <Grid item xs={2} key={emoji} justifyContent="center" alignItems="center" display={"flex"}
                          width={10}>
                        <IconButton size={"small"} onClick={() => props.onclick(emoji)}>
                            {/*<EmojiFlagsSharp fontSize="large" />*/}
                            <div>{emoji}</div>
                        </IconButton>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
}
