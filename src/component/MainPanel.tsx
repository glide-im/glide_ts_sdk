import { Chat as ChatIcon, PersonSearch } from "@mui/icons-material";
import CropSquareIcon from '@mui/icons-material/CropSquare';
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import { Avatar, Box, Button, Grid, IconButton, Typography } from "@mui/material";
import { grey } from "@mui/material/colors";
import React, { useEffect, useState } from "react";
import { Link, Redirect, Route, RouteComponentProps, Switch, useRouteMatch, withRouter } from "react-router-dom";
import { State, Ws } from "src/im/ws";
import { Account } from "../im/account";
import { Chat } from "./chat/Chat";
import { ContactsList } from "./friends/ContactsList";
import { Square } from "./square/Square";
import { Version } from "./version";

export const MainPanel = withRouter((props: RouteComponentProps) => {

    if (!Account.getInstance().isAuthenticated()) {
        props.history.push("/auth");
        return <></>
    }

    const match = useRouteMatch();

    return (
        <Grid container style={{ boxShadow: "grey 6px 7px 15px 0px" }}>
            {/* <Grid item xs={1} style={{ height: "700px" }}> */}
                {/* <Bar /> */}
            {/* </Grid> */}
            <Grid item xs={12} style={{ height: "500px" }} sx={{ bgcolor: grey[50] }}>
                <Switch>
                    <Route path={`${match.url}/session/:to`} children={<Chat />} />
                    {/* <Route path={`${match.url}/friends`} children={<ContactsList />} /> */}
                    {/* <Route path={`${match.url}/square`} children={<Square />} /> */}
                    <Route path={`${match.url}/session`} exact={true}>
                        <Redirect to={`${match.url}/session/${Account.getInstance().getSessionList().currentChatTo}`} />
                    </Route>
                    <Route path={`${match.url}/`} exact={true}>
                        <Redirect to={`${match.url}/session/0`} />
                    </Route>
                </Switch>
            </Grid>
        </Grid>
    )
});


export const Bar = withRouter((props: RouteComponentProps) => {

    let avatar = ""
    let nickname = ""

    const userInfo = Account.getInstance().getUserInfo()
    const [online, setOnline] = useState(Ws.isConnected())

    if (userInfo) {
        avatar = userInfo.avatar
        nickname = userInfo.name + "\r\n" + userInfo.uid
    }

    useEffect(() => {
        const l = (s: State, _: any) => {
            if (s === State.CLOSED) {
                setOnline(false)
            } else if (s === State.CONNECTED) {
                setOnline(true)
            }
        }
        Ws.addStateListener(l)
        return () => { Ws.removeStateListener(l) }
    }, []);

    const onExitClick = () => {
        Account.getInstance().clearAuth()
        props.history.replace("/auth")
    }

    const Reconnect = () => {
        Account.getInstance().auth()
            .subscribe({
                next: () => {
                },
                error: (e) => {
                    alert(e)
                }
            })
    }

    const menu = [
        {
            icon: <ChatIcon color={"action"} />,
            path: "/im/session",
        },
        {
            icon: <PeopleAltIcon />,
            path: "/im/friends",
        },
        {
            icon: <CropSquareIcon />,
            path: "/im/square",
        },
        {
            icon: <PersonSearch />,
            path: "/im/search",
        },
    ]

    return <Box bgcolor={"primary.dark"} style={{ height: "100%" }}>

        <Grid justifyContent={"center"} container color={"primary.dark"}>

            <Grid container justifyContent={"center"} marginTop={"16px"}>
                <Box mt={2}><Avatar src={avatar} /></Box>
            </Grid>

            <Grid container justifyContent={"center"}>
                <Box m={2}>
                    <Typography align={"center"} variant={"caption"} color={online ? "ghostwhite" : "red"}>
                        {nickname}
                    </Typography>
                    {online ? "" : <Button onClick={Reconnect}>Reconnect</Button>}
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
                    <ExitToAppIcon />
                </IconButton>

            </Grid>


        </Grid>
        <Grid container justifyContent={"center"}>
            <Box m={2}>
                <Version />
            </Box>
        </Grid>
    </Box>
})
