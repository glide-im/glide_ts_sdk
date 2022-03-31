import {Avatar, Box, Grid, IconButton, Typography} from "@mui/material";
import {Link, Redirect, Route, RouteComponentProps, Switch, useRouteMatch, withRouter} from "react-router-dom";
import {Chat} from "./Chat";
import {ContactsList} from "./ContactsList";
import React from "react";
import {IMAccount} from "../im/account";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import {Chat as ChatIcon, PersonSearch} from "@mui/icons-material";
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
                        <Redirect to={`${match.url}/session/${IMAccount.getSessionList().currentSid}`}/>
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

    let avatar = ""
    let nickname = ""

    const userInfo = IMAccount.getUserInfo()

    if (userInfo) {
        avatar = userInfo.Avatar
        //nickname = userInfo.Nickname + "\r\n" + userInfo.Uid
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
