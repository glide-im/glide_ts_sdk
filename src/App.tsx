import { Box, CircularProgress, Container, Grid } from "@mui/material";
import React, { useEffect, useState } from 'react';
import { HashRouter, Redirect, Route, Switch } from "react-router-dom";
import { Api } from "./api/api";
import './App.css';
import { Auth } from "./component/auth/Auth";
import { Register } from "./component/auth/Register";
import { MainPanel } from "./component/MainPanel";
import { SnackBar } from "./component/SnackBar";
import { Account } from "./im/account";
import { getCookie } from "./utils/Cookies";

function App() {

    const authed = Account.getInstance().isAuthenticated()
    const [state, setState] = useState({
        isAuthenticated: authed,
        isLoading: authed,
    })

    useEffect(() => {
        const base = getCookie("baseUrl")
        if (base) {
            Api.setBaseUrl(base)
        }
    }, [])

    useEffect(() => {
        if (Account.getInstance().isAuthenticated()) {
            console.log("start auth");

            Account.getInstance().auth()
                .subscribe({
                    next: (r) => {
                        console.log(r)
                    },
                    error: (e) => {
                        console.log("auth error", e);
                    },
                    complete: () => {
                        console.log("auth complete");

                        setState({
                            isAuthenticated: true,
                            isLoading: false,
                        })
                    }
                });
        }
    }, [])


    return (
        <div className="App">
            <SnackBar />
            {/*<MessageStack/>*/}
            <Container color={"text.disabled"} style={{ height: "100vh" }}>
                <HashRouter>
                    <Grid container color={"text.disabled"} style={{ height: "100vh", width: "1000px", margin: "auto" }}
                        alignItems={"center"}>

                        {state.isLoading ? <Loading /> :
                            <Switch>
                                <Route path={"/auth/signin"} exact={true}>
                                    <Auth />
                                </Route>
                                <Route path={"/auth/signup"} exact={true}>
                                    <Register />
                                </Route>
                                <Route path={"/auth"} exact={true}>
                                    <Redirect to={'/auth/signin'} />
                                </Route>
                                <Route path={"/im"}>
                                    <MainPanel />
                                </Route>
                                <Route path={"/"}>
                                    {state.isAuthenticated ? <Redirect to={'/im'} /> : <Redirect to={'/auth'} />}
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
                <CircularProgress />
                {/*<Typography variant={"h5"} component={"p"}>{props.msg}</Typography>*/}
            </Box>
        </Grid>
    );
}

export default App;
