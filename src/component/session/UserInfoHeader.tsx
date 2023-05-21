import {RouteComponentProps, withRouter} from "react-router-dom";
import {Account} from "../../im/account";
import React, {useEffect, useRef, useState} from "react";
import {IMWsClient} from "../../im/im_ws_client";
import {Avatar, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField} from "@mui/material";
import {grey} from "@mui/material/colors";


export const UserInfoHeader = withRouter((props: RouteComponentProps) => {

    let u = Account.getInstance().getUserInfo()
    if (u === null) {
        u = {
            avatar: "-", name: "-", id: "-", isChannel: false
        }
    }

    const [online, setOnline] = useState(IMWsClient.isReady())

    useEffect(()=>{

    })

    useEffect(() => {

        const sp = IMWsClient.events().subscribe({
            next: (e) => {
                e.state === WebSocket.OPEN ? setOnline(true) : setOnline(false)
            }
        })
        return () => sp.unsubscribe()
    }, []);

    const onExitClick = () => {
        Account.getInstance().logout()
        props.history.replace("/auth")
    }

    const reconnect = () => {
        Account.getInstance().auth().subscribe()
    }

    return <Box>
        <div className={'flex justify-between items-center py-5 pr-10 pl-4'}>
            <div className={'flex items-center'}>
                <Avatar src={u.avatar} sx={{width: 40, height: 40, bgcolor: grey[400]}}/>
                <div className={'text-left flex flex-col ml-5'}>
                    <span className={'text-base'}>{u.name}</span>
                    <span className={'text-sm'}>UID: {u.id}</span>
                </div>
            </div>

            <div>
                <Button size={'small'} onClick={onExitClick}>
                    退出登录
                </Button>
                {online ? <></> :
                    <Button onClick={reconnect} size={'small'} color={'warning'}>
                        重新连接
                    </Button>
                }
                <CreateSessionButton/>
            </div>
        </div>
    </Box>
})


function CreateSessionButton() {

    const [show, setShow] = useState(false)
    const onCreateSessionClick = () => {
        setShow(true)
    }

    return <>
        <CreateSessionDialog open={show} callback={(uid) => {
            if (uid.length > 2) {
                Account.getInstance().getSessionList().createSession(uid).subscribe()
            }
            setShow(false)
        }}/>
        <Button size={'small'} onClick={onCreateSessionClick}>
            创建会话
        </Button>
    </>
}

function CreateSessionDialog(props: { open: boolean, callback: (uid: string) => void }) {

    const input = useRef<HTMLInputElement>()

    return <Box>
        <Dialog fullWidth open={props.open} onClose={() => {
            props.callback('')
        }} aria-labelledby="form-dialog-title">
            <DialogTitle id="form-dialog-title">创建会话</DialogTitle>
            <DialogContent>
                <TextField inputRef={input} autoFocus margin="dense" id="text" label="用户 UID"
                           type="text"
                           fullWidth defaultValue={''}/>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => {
                    props.callback(input.current.value)
                }} color="primary">
                    创建
                </Button>
            </DialogActions>
        </Dialog>
    </Box>
}
