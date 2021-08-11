import {Avatar, Box, Grid, IconButton, Snackbar, Typography} from "@material-ui/core";
import React, {useEffect, useState} from "react";
import {AccountBox, AddBox, ChatBubble, ViewList} from "@material-ui/icons";
import {State, Ws} from "../im/ws";
import {MyDialog} from "./SignDialog";
import {client} from "../im/client";
import {RouteComponentProps, withRouter} from "react-router-dom";


export const Bar = withRouter((props: RouteComponentProps) => {

    const [state, setState] = useState(State.CONNECTED)
    const [showDialog, setShowDialog] = useState(false)
    const [snack, setSnack] = useState(false)
    const [snackMsg, setSnackMsg] = useState("")
    const [uid, setUid] = useState(-1)

    useEffect(() => {
        Ws.addStateListener((s) => {
            setState(s)
        })
    }, [state])

    const changeState = () => {
        if (state === State.CONNECTED) {
            Ws.close()
        } else {
            Ws.connect()
        }
    }

    let s: 'error' | 'action' | 'disabled'
    switch (state) {
        case State.CONNECTED:
            if (client.uid <= 0 && props.location.pathname !== "/") {
                props.history.push("/")
            }
            s = "disabled"
            break;
        case State.CONNECTING:
            s = "action"
            break;
        case State.CLOSED:
            if (props.location.pathname !== "/disconnected") {
                props.history.push("/disconnected")
            }
            if (uid !== -1) {
                setUid(-1)
            }
            s = "error"
            break;
    }

    const auth = function (reg: boolean, p: { account: string, password: string }) {
        if (reg) {
            client.register(p.account, p.account)
                .then(v => {
                    setSnackMsg("register success")
                    setSnack(true)
                    setShowDialog(false)
                })
                .catch((r) => {
                    setSnackMsg(r)
                    setSnack(true)
                })
        } else {
            client.login(p.account, p.account)
                .then(value => {
                    setUid(value.Uid)
                    props.history.push("/message")
                    setShowDialog(false)
                })
        }
    }

    let avatar = ""
    let nickname = ""

    const userInfo = client.getCachedUserInfo(uid)
    if (userInfo) {
        avatar = userInfo.Avatar
        nickname = userInfo.Nickname + "_" + userInfo.Uid
    }

    return <Box bgcolor={"primary.dark"} style={{height: "100%"}}>

        <Snackbar open={snack} autoHideDuration={4000} onClose={() => {
            setSnack(false)
        }} message={snackMsg}/>
        <MyDialog open={showDialog} onClose={() => {
            setShowDialog(!showDialog)
        }} onSubmit={auth}/>

        <Grid justifyContent={"center"} container color={"primary.dark"}>
            <Box m={2}>
                <Avatar src={avatar}/>
                <Typography align={"center"} variant={"subtitle2"}>{nickname}</Typography>
            </Box>
            <IconButton onClick={changeState}>
                <AccountBox color={s}/>
            </IconButton>
            <IconButton onClick={() => {
                props.history.push("/message")
            }}>
                <ChatBubble/>
            </IconButton>
            <IconButton onClick={() => {
                props.history.push("/friends")
            }}>
                <ViewList/>
            </IconButton>
            <IconButton onClick={() => {
                setShowDialog(true)
            }}>
                <AddBox/>
            </IconButton>
        </Grid>
    </Box>
})
