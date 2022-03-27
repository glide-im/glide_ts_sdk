import React, {useEffect} from 'react';
import './App.css';
import {Box, CircularProgress, Container, Grid} from "@mui/material";
import {HashRouter, Redirect, Route, Switch} from "react-router-dom";
import {SnackBar} from "./component/SnackBar";
import MessageStack from "./component/MessageSnackbar";
import {Auth} from "./component/Auth";
import {Register} from "./component/Register";
import {MainPanel} from "./component/MainPanel";
import {getCookie} from "./utils/Cookies";
import {auth} from "./api/api";
import {setHeader} from "./api/axios";

function App() {

    const token = getCookie("token");
    const [isAuthenticated, setIsAuthenticated] = React.useState(token !== "");
    const [isLoading, setIsLoading] = React.useState(token !== "");

    useEffect(() => {
        if (isAuthenticated) {
            auth(token).then(res => {
                setHeader("Authorization", "Bearer " + token);
                setIsAuthenticated(true);
            }).catch(err => {
                setIsAuthenticated(false);
            }).finally(() => {
                setIsLoading(false);
            });
        }
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

                        {isLoading ? <Loading/> :
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
                                    {isAuthenticated ? <Redirect to={'/im'}/> : <Redirect to={'/auth'}/>}
                                </Route>
                            </Switch>
                        }
                    </Grid>
                </HashRouter>
            </Container>
        </div>
    );
}

function Loading(props: { msg?: string }) {
    return (
        <Grid container justifyContent={"center"}>
            <Box>
                <CircularProgress/>
                {/*<Typography variant={"h5"} component={"p"}>{props.msg}</Typography>*/}
            </Box>
        </Grid>
    );
}

export default App;
