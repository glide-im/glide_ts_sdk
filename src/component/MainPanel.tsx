import {Avatar, Box, Grid, IconButton, Typography} from "@mui/material";
import {Link, Redirect, Route, RouteComponentProps, Switch, useRouteMatch, withRouter} from "react-router-dom";
import {Chat} from "./Chat";
import {ContactsList} from "./ContactsList";
import React, {useEffect, useState} from "react";
import {client, IMAccount} from "../im/client";
import {IMChatList} from "../im/chat_list";
import {State, Ws} from "../im/ws";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import {PersonSearch, Chat as ChatIcon} from "@mui/icons-material";
import {MyDialog} from "./SignDialog";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";

export const MainPanel = withRouter((props: RouteComponentProps) => {

    if (!IMAccount.isAuthenticated()) {
        console.log("redirect to login");
        props.history.push("/auth");
        return <></>
    }

    const match = useRouteMatch();

    return (
        <Grid container style={{boxShadow: "grey 6px 7px 15px 0px"}}>
            <Grid item xs={1} style={{height: "700px"}}>
                <Bar/>
            </Grid>
            <Grid item xs={11} style={{height: "700px"}}>
                <Switch>
                    <Route path={`${match.url}/session/:sid`} children={<Chat/>}/>
                    <Route path={`${match.url}/friends`} children={<ContactsList/>}/>
                    <Route path={`${match.url}/session`} exact={true}>
                        <Redirect to={`${match.url}/session/${IMChatList.currentSid}`}/>
                    </Route>
                    <Route path={`${match.url}/`} exact={true}>
                        <Redirect to={`${match.url}/session/0`}/>
                    </Route>
                </Switch>
            </Grid>
        </Grid>
    )
});


export const Bar = withRouter((props: RouteComponentProps) => {

    const [state, setState] = useState(State.CONNECTED)
    const [showDialog, setShowDialog] = useState(false)
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
                // props.history.push("/")
            }
            s = "disabled"
            break;
        case State.CONNECTING:
            s = "action"
            break;
        case State.CLOSED:
            // if (props.location.pathname !== "/disconnected") {
            //     props.history.push("/disconnected")
            // }
            if (uid !== -1) {
                setUid(-1)
            }
            s = "error"
            break;
    }

    const auth = function (reg: boolean, p: { account: string, password: string }) {
        if (reg) {

        } else {

        }
    }

    let avatar = ""
    let nickname = ""

    const userInfo = client.getCachedUserInfo(uid)
    if (userInfo) {
        avatar = userInfo.Avatar
        nickname = userInfo.Nickname + "\r\n" + userInfo.Uid
    }

    const onExitClick = () => {
        IMAccount.clearAuth()
        props.history.replace("/auth")
    }

    const menu = [
        {
            icon: <ChatIcon color={"action"}/>,
            path: "/im/session",
        },
        {
            icon: <PeopleAltIcon/>,
            path: "/im/friends",
        },
        {
            icon: <PersonSearch/>,
            path: "/im/search",
        },
    ]

    return <Box bgcolor={"primary.dark"} style={{height: "100%"}}>
        <MyDialog open={showDialog} onClose={() => {
            setShowDialog(!showDialog)
        }} onSubmit={auth}/>

        <Grid justifyContent={"center"} container color={"primary.dark"}>

            <Grid container justifyContent={"center"} marginTop={"16px"}>
                <Box mt={2}><Avatar src={avatar}/></Box>
            </Grid>

            <Grid container justifyContent={"center"}>
                <Box m={2}>
                    <Typography align={"center"} variant={"subtitle2"} color={"ghostwhite"}>
                        {nickname} {IMAccount.getUID()}
                    </Typography>
                </Box>
            </Grid>

            {menu.map(item => {
                return <Grid container justifyContent={"center"} key={item.path}>
                    <Link to={item.path}>
                        <IconButton>
                            {item.icon}
                        </IconButton>
                    </Link>
                </Grid>
            })}

            <Grid container justifyContent={"center"}>
                <IconButton onClick={onExitClick}>
                    <ExitToAppIcon/>
                </IconButton>
            </Grid>
        </Grid>
    </Box>
})
