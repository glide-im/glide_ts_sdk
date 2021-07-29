import {Avatar, Box, Grid, IconButton, Snackbar, Typography} from "@material-ui/core";
import React, {useEffect, useState} from "react";
import {AccountBox, AddBox, ChatBubble, ViewList} from "@material-ui/icons";
import {State, Ws} from "../im/ws";
import {MyDialog} from "./Dialog";
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
    }, [])

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
            s = "disabled"
            break;
        case State.CONNECTING:
            s = "action"
            break;
        case State.CLOSED:
            s = "error"
            break;
    }

    const auth = function (reg: boolean, p: { account: string, password: string }) {
        if (reg) {
            client.register(p.account, p.password, function (success, result, msg) {
                if (result) {
                    setSnackMsg("register success")
                } else {
                    setSnackMsg(msg)
                }
                setSnack(true)
                setShowDialog(false)
            })
        } else {
            client.login(p.account, p.password, function (success, result, msg) {
                if (success) {
                    setSnackMsg("login success token=" + result.Token)
                } else {
                    setSnackMsg(msg)
                }
                setUid(result.Uid)
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
                <Typography variant={"subtitle2"}>uid:{uid}</Typography>
            </Box>
            <IconButton onClick={changeState}>
                <AccountBox color={s}/>
            </IconButton>
            <IconButton onClick={() => {
                props.history.push("/")
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
