import {Avatar, Box, Grid, IconButton} from "@material-ui/core";
import React, {useEffect, useState} from "react";
import {AccountBox, AddBox, ChatBubble, ViewList} from "@material-ui/icons";
import {State, ws} from "../im/ws";
import {client} from "../im/client";


export function Bar() {

    const [state, setState] = useState(State.CONNECTED)

    useEffect(() => {
        ws.addStateListener((s) => {
            setState(s)
        })
    }, [])

    const changeState = () => {
        if (state === State.CONNECTED) {
            ws.close()
        } else {
            ws.connect()
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

    const login = () => {
        client.login("1234", "1234")
    }

    return <Box bgcolor={"primary.dark"} style={{height: "100%"}}>
        <Grid justifyContent={"center"} container color={"primary.dark"}>
            <Box m={2}>
                <Avatar/>
            </Box>
            <IconButton onClick={changeState}>
                <AccountBox color={s}/>
            </IconButton>
            <IconButton onClick={login}>
                <ChatBubble/>
            </IconButton>
            <IconButton>
                <ViewList/>
            </IconButton>
            <IconButton>
                <AddBox/>
            </IconButton>
        </Grid>
    </Box>
}
