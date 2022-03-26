import {Grid} from "@mui/material";
import {Bar} from "./Bar";
import {Route, Switch, useRouteMatch} from "react-router-dom";
import {ChatList} from "./ChatList";
import {ContactsList} from "./ContactsList";
import React from "react";

export function MainPanel() {

    const match = useRouteMatch();

    return (
        <Grid container style={{boxShadow: "grey 6px 7px 15px 0px"}}>
            <Grid item xs={1} style={{height: "700px"}}>
                <Bar/>
            </Grid>
            <Grid item xs={11} style={{height: "700px"}}>
                <Switch>
                    <Route path={`${match.url}/message`} exact={true} children={<ChatList/>}/>
                    <Route path={"/friends"} exact={true} children={<ContactsList/>}/>
                </Switch>
            </Grid>
        </Grid>
    )
}