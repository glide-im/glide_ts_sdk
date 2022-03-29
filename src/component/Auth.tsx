import React, {useRef} from "react";
import {Avatar, Box, Button, Grid, Link, Paper, TextField, Typography} from "@mui/material";
import {login} from "../api/api";
import {Link as RtLink, RouteComponentProps, withRouter} from "react-router-dom";
import {setHeader} from "../api/axios";
import {IMAccount} from "../im/client";

export const Auth = withRouter((props: RouteComponentProps) => {

    const accountInput = useRef<HTMLInputElement>(null)
    const passwordInput = useRef<HTMLInputElement>(null)

    const token = IMAccount.getToken()

    if (token) {
        props.history.push("/im");
        return <></>
    }

    const submit = () => {
        const account = accountInput.current.value;
        const password = passwordInput.current.value;

        login(account, password)
            .then((resp) => {
                IMAccount.setAuth(resp.Uid, resp.Token);
                setHeader("Authorization", "Bearer " + resp.Token);
                props.history.push("/im");
            })
            .catch((reason) => {
                alert(reason);
            });
    }

    return (
        <Grid container justifyContent={"center"}>
            <Paper variant={"outlined"}>
                <Box width={"400px"} padding={"16px"}>
                    <Grid container justifyContent={"center"} marginTop={"20px"}>
                        <Avatar sizes={"100px"}/>
                    </Grid>
                    <Typography variant="h4" style={{marginTop: "30px", marginBottom: "16px"}}>
                        Sign In
                    </Typography>

                    <TextField inputRef={accountInput} required autoFocus margin="dense" id="account" label="Account"
                               type="text"
                               fullWidth/>
                    <TextField inputRef={passwordInput} required margin="dense" id="password" label="Password"
                               type="password"
                               fullWidth/>
                </Box>
                <Grid container padding={"0px 16px 32px 16px"}>
                    <Grid item xs={12}>
                        <Grid container justifyContent={"right"}>

                            <RtLink to={"./reset"}>
                                <Link>Forgot Password?</Link>
                            </RtLink>
                            <Typography variant={"body1"}>
                                &nbsp;&nbsp;or&nbsp;&nbsp;
                            </Typography>
                            <RtLink to={"./signup"}>
                                <Link>Register</Link>
                            </RtLink>
                        </Grid>
                    </Grid>
                    <Grid item xs={12} marginTop={"60px"}>
                        <Grid container justifyContent={"right"}>
                            {/*<CircularProgress color="inherit" />*/}
                            <Button variant="contained" color="primary" style={{marginTop: "20px"}} onClick={submit}>
                                Submit
                            </Button>
                        </Grid>
                    </Grid>
                </Grid>
            </Paper>
        </Grid>
    )
});
