import {Grid} from "@mui/material";
import {grey} from "@mui/material/colors";
import React from "react";
import {Redirect, Route, RouteComponentProps, Switch, useRouteMatch, withRouter} from "react-router-dom";
import {Account} from "../im/account";
import {Chat} from "./chat/Chat";
import {ContactsList} from "./friends/ContactsList";
import {Square} from "./square/Square";

export const MainPanel = withRouter((props: RouteComponentProps) => {

    if (!Account.getInstance().isAuthenticated()) {
        props.history.push("/auth");
        return <></>
    }

    const match = useRouteMatch();

    return (
        <Grid container style={{boxShadow: "grey 6px 7px 15px 0px"}}>
            <Grid item xs={12} style={{height: "600px"}} sx={{bgcolor: grey[100]}}>
                <Switch>
                    <Route path={`${match.url}/session/:sid`} children={<Chat/>}/>
                    <Route path={`${match.url}/friends`} children={<ContactsList/>}/>
                    <Route path={`${match.url}/square`} children={<Square/>}/>
                    <Route path={`${match.url}/session`} exact={true}>
                        <Redirect to={`${match.url}/session/${Account.getInstance().getSessionList().currentChatTo}`}/>
                    </Route>
                    <Route path={`${match.url}/`} exact={true}>
                        <Redirect to={`${match.url}/session/0`}/>
                    </Route>
                </Switch>
            </Grid>
        </Grid>
    )
});

