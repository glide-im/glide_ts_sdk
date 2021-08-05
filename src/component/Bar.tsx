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
            if (client.getMyUid() <= 0 && props.location.pathname !== "/"){
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
            s = "error"
            break;
    }

    const auth = function (reg: boolean, p: { account: string, password: string }) {
        if (reg) {
            client.register(p.account, p.account, function (success, result, msg) {
                if (result) {
                    setSnackMsg("register success")
                } else {
                    setSnackMsg(msg)
                }
                setSnack(true)
                setShowDialog(false)
            })
        } else {
            client.login(p.account, p.account, function (success, result, msg) {
                if (success) {
                    setSnackMsg("login success token=" + result.Token)
                    setUid(result.Uid)
                    props.history.push("/message")
                } else {
                    setSnackMsg(msg)
                }
                setSnack(true)
                setShowDialog(false)
            })
        }
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
                <Avatar/>
                <Typography align={"center"} variant={"subtitle2"}>{uid}</Typography>
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
