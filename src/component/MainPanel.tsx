import {Grid} from "@mui/material";
import {Bar} from "./Bar";
import {Redirect, Route, RouteComponentProps, Switch, useRouteMatch, withRouter} from "react-router-dom";
import {ChatList} from "./ChatList";
import {ContactsList} from "./ContactsList";
import React from "react";
import {IMAccount} from "../im/client";
import {IMChatList} from "../im/ChatList";

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
                    <Route path={`${match.url}/session/:sid`} children={<ChatList/>}/>
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
