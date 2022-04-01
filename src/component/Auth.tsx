import { Avatar, Box, Button, Grid, Paper, TextField, Typography } from "@mui/material";
import React, { useRef } from "react";
import { Link as RtLink, RouteComponentProps, withRouter } from "react-router-dom";
import { Account } from "../im/account";

export const Auth = withRouter((props: RouteComponentProps) => {

    const accountInput = useRef<HTMLInputElement>(null)
    const passwordInput = useRef<HTMLInputElement>(null)

    const token = Account.getInstance().getToken()

    if (token) {
        props.history.push("/im");
        return <></>
    }

    const submit = () => {
        const account = accountInput.current.value;
        const password = passwordInput.current.value;

        Account.getInstance().login(account, password)
        .subscribe({
            next: (r) => {
                console.log( r)
            },
            error: (e) => {
                alert(e.message)
            },
            complete: () => {
                props.history.push("/im");
            }
        })
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
                                Forgot Password?
                            </RtLink>
                            <Typography variant={"body1"}>
                                &nbsp;&nbsp;or&nbsp;&nbsp;
                            </Typography>
                            <RtLink to={"./signup"}>
                                Register
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
