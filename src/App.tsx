import {Box, Grid} from "@mui/material";
import React, {useEffect, useState} from 'react';
import {HashRouter, Redirect, Route, Switch} from "react-router-dom";
import {Api} from "./api/api";
import './App.css';
import {Register} from "./component/auth/Register";
import {AppMainPanel} from "./component/AppMainPanel";
import {showSnack, SnackBar} from "./component/widget/SnackBar";
import {Account} from "./im/account";
import {getCookie} from "./utils/Cookies";
import {Guest} from "./component/auth/Guest";
import {Loading} from "./component/widget/Loading";
import {Subscription} from "rxjs";

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

        let subscription: Subscription | null = null
        if (authed) {
            subscription = Account.getInstance().auth()
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
                        setState({
                            isAuthenticated: true,
                            isLoading: false,
                        })
                    }
                });
        } else {
            Account.getInstance().logout()
        }
        return (() => {
            Account.getInstance().logout()
            subscription?.unsubscribe()
        })
    }, [authed])


    return (
        <div className="App">
            <SnackBar/>
            <Box sx={{width: '100%', position: 'relative'}}>
                <Box sx={{
                    position: 'absolute',
                    backgroundImage: "url('./app_bg.jpg')",
                    zIndex: -1,
                    width: '100%',
                    height: '100vh',
                    filter: 'saturate(0.6)',
                }}/>
                <HashRouter>
                    <Grid container style={{height: "100vh"}} alignItems={"center"}>

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
                                <Route path={"/im"}>
                                    <Box bgcolor={'white'} width={'100%'}>
                                        <AppMainPanel/>
                                    </Box>
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
    );
}

export default App;
