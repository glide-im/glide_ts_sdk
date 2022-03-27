import {Grid} from "@mui/material";
import {Bar} from "./Bar";
import {Redirect, Route, Switch, useRouteMatch} from "react-router-dom";
import {ChatList} from "./ChatList";
import {ContactsList} from "./ContactsList";
import React from "react";

export function MainPanel() {

    const match = useRouteMatch();

    console.log(match);

    return (
        <Grid container style={{boxShadow: "grey 6px 7px 15px 0px"}}>
            {/*<Redirect to={'/signin'}/>*/}

            <Grid item xs={1} style={{height: "700px"}}>
                <Bar/>
            </Grid>
            <Grid item xs={11} style={{height: "700px"}}>
                <Switch>
                    <Route path={`${match.url}/message`} children={<ChatList/>}/>
                    <Route path={`${match.url}/friends`} children={<ContactsList/>}/>
                    <Route path={`${match.url}/`} exact={true} >
                        <Redirect to={`${match.url}/message`}/>
                    </Route>
                </Switch>
            </Grid>
        </Grid>
    )
}