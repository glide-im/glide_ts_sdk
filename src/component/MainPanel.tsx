import {Grid} from "@mui/material";
import {Bar} from "./Bar";
import {Redirect, Route, RouteComponentProps, Switch, useRouteMatch, withRouter} from "react-router-dom";
import {ChatList} from "./ChatList";
import {ContactsList} from "./ContactsList";
import React, {useEffect} from "react";
import {getCookie} from "../utils/Cookies";

export const MainPanel = withRouter((props: RouteComponentProps) => {

    useEffect(() => {
        const token = getCookie("token");
        if (token === "") {
            props.history.replace("/auth");
        }
    }, []);

    const match = useRouteMatch();

    console.log(match);

    return (
        <Grid container style={{boxShadow: "grey 6px 7px 15px 0px"}}>
            <Grid item xs={1} style={{height: "700px"}}>
                <Bar/>
            </Grid>
            <Grid item xs={11} style={{height: "700px"}}>
                <Switch>
                    <Route path={`${match.url}/session`} children={<ChatList/>}/>
                    <Route path={`${match.url}/friends`} children={<ContactsList/>}/>
                    <Route path={`${match.url}/`} exact={true}>
                        <Redirect to={`${match.url}/session`}/>
                    </Route>
                </Switch>
            </Grid>
        </Grid>
    )
});