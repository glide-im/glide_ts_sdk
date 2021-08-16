import React, {useEffect} from 'react';
import './App.css';
import {Container, Grid} from "@material-ui/core";
import {Bar} from "./component/Bar";
import {BrowserRouter, Route, Switch} from "react-router-dom";
import {ChatList} from "./component/ChatList";
import {ContactsList} from "./component/ContactsList";
import {Ws} from "./im/ws";
import {SnackBar} from "./component/SnackBar";
import MessageStack from "./component/MessageSnackbar";
import {client} from "./im/client";

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
                        <Grid container style={{boxShadow: "grey 6px 7px 15px 0px"}}>
                            <Grid item md={1} style={{height: "700px"}}>
                                <Bar/>
                            </Grid>
                            <Grid item md={11} style={{height: "700px"}}>
                                <Switch>
                                    <Route path={"/message"} exact={true} children={<ChatList/>}/>
                                    <Route path={"/friends"} exact={true}>
                                        <ContactsList/>
                                    </Route>
                                    <Route path={"/disconnected"} exact={true}/>
                                </Switch>
                            </Grid>
                        </Grid>
                    </Grid>
                </BrowserRouter>
            </Container>
        </div>
    );
}

export default App;
