import {Box, Grid} from "@mui/material";
import React, {useEffect, useState} from 'react';
import {HashRouter, Redirect, Route, Switch} from "react-router-dom";
import {Api} from "./api/api";
import './App.css';
import {Register} from "./component/auth/Register";
import {MainPanel} from "./component/MainPanel";
import {showSnack, SnackBar} from "./component/SnackBar";
import {Account} from "./im/account";
import {getCookie} from "./utils/Cookies";
import {Guest} from "./component/auth/Guest";
import {MessageInput} from "./component/chat/MessageInput";
import {Loading} from "./component/Loading";


function App() {

    const authed = Account.getInstance().isAuthenticated()
    const [state, setState] = useState({
        isAuthenticated: authed,
        isLoading: authed,
    })

    useEffect(() => {
        const base = getCookie("baseUrl")
        const ws = getCookie('wsUrl')
        if (base) {
            Api.setBaseUrl(base)
        }
        if (ws) {
            Account.getInstance().server = ws
        }
    }, [])

    useEffect(() => {
        if (authed) {
            console.log("start auth");

            Account.getInstance().auth()
                .subscribe({
                    next: (r) => {
                        console.log(r)
                    },
                    error: (e) => {
                        console.log("auth error", e);
                        setState({
                            isAuthenticated: false,
                            isLoading: false,
                        })
                        showSnack(e.message)
                    },
                    complete: () => {
                        console.log("auth complete");
                        setState({
                            isAuthenticated: true,
                            isLoading: false,
                        })
                    }
                });
        } else {
            Account.getInstance().logout()
        }
    }, [authed])


    return (
        <div className="App">
            <SnackBar/>
            <Box sx={{height: "100vh", width: '100%'}}>
                <HashRouter>
                    <Grid container style={{height: "100vh"}} alignItems={"center"} bgcolor={'white'}>

                        {state.isLoading ? <Loading/> :
                            <Switch>
                                <Route path={"/auth/signin"} exact={true}>
                                    {/*<Auth/>*/}
                                    <Guest/>
                                </Route>
                                <Route path={"/auth/signup"} exact={true}>
                                    <Register/>
                                </Route>
                                <Route path={"/auth"} exact={true}>
                                    <Redirect to={'/auth/signin'}/>
                                </Route>
                                <Route path={'/t'} exact={true}>
                                    <Box height={'200px'} width={'100%'} bgcolor={"blue"}>
                                        <MessageInput onSend={() => {
                                        }}/>
                                    </Box>
                                </Route>
                                <Route path={"/im"}>
                                    <MainPanel/>
                                </Route>
                                <Route path={"/"} strict={true}>
                                    {state.isAuthenticated ? <Redirect to={'/im'}/> : <Redirect to={'/auth'}/>}
                                </Route>
                            </Switch>
                        }
                    </Grid>
                </HashRouter>
            </Box>
        </div>
    )
        ;
}

export default App;
