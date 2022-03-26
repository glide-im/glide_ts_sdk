import React, {useEffect} from 'react';
import './App.css';
import {Container, Grid} from "@mui/material";
import {BrowserRouter, Route, Switch} from "react-router-dom";
import {Ws} from "./im/ws";
import {SnackBar} from "./component/SnackBar";
import MessageStack from "./component/MessageSnackbar";
import {client} from "./im/client";
import {Auth} from "./component/Auth";
import {Register} from "./component/Register";
import {MainPanel} from "./component/MainPanel";

function App() {

    useEffect(() => {
        Ws.connect()
        client.Init()
    }, [])

    return (
        <div className="App">
            <SnackBar/>
            <MessageStack/>
            <Container color={"text.disabled"} style={{height: "100vh"}}>
                <BrowserRouter>
                    <Grid container color={"text.disabled"} style={{height: "100vh", width: "1000px", margin: "auto"}}
                          alignItems={"center"}>
                        <Switch>
                            <Route path={"/signin"} exact={true} children={<Auth/>}/>
                            <Route path={"/signup"} exact={true} children={<Register/>}/>
                            <Route path={"/"}  children={<MainPanel/>}/>
                        </Switch>
                    </Grid>
                </BrowserRouter>
            </Container>
        </div>
    );
}

export default App;
