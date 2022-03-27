import React, {useEffect} from 'react';
import './App.css';
import {Container, Grid} from "@mui/material";
import {HashRouter, Redirect, Route, Router, Switch} from "react-router-dom";
import {SnackBar} from "./component/SnackBar";
import MessageStack from "./component/MessageSnackbar";
import {Auth} from "./component/Auth";
import {Register} from "./component/Register";
import {MainPanel} from "./component/MainPanel";

function App() {

    useEffect(() => {
        // Ws.connect()
        // client.Init()
    }, [])

    return (
        <div className="App">
            <SnackBar/>
            <MessageStack/>
            <Container color={"text.disabled"} style={{height: "100vh"}}>
                <HashRouter>
                    <Grid container color={"text.disabled"} style={{height: "100vh", width: "1000px", margin: "auto"}}
                          alignItems={"center"}>
                        <Switch>
                            <Route path={"/auth/signin"} exact={true}>
                                <Auth/>
                            </Route>
                            <Route path={"/auth/signup"} exact={true}>
                                <Register/>
                            </Route>
                            <Route path={"/auth"} exact={true}>
                                <Redirect to={'/auth/signin'}/>
                            </Route>
                            <Route path={"/im"}>
                                <MainPanel/>
                            </Route>
                            <Route path={"/"}>
                                <Redirect to={'/auth'}/>
                            </Route>
                        </Switch>
                    </Grid>
                </HashRouter>
            </Container>
        </div>
    );
}

export default App;
