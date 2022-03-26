import React, {useRef} from "react";
import {Avatar, Box, Button, Grid, Link, Paper, TextField, Typography} from "@mui/material";
import {login} from "../api/api";
import {RouteComponentProps, withRouter} from "react-router-dom";

export const Auth = withRouter((props: RouteComponentProps) =>  {

    const accountInput = useRef<HTMLInputElement>(null)
    const passwordInput = useRef<HTMLInputElement>(null)

    const submit = () => {
        const account = accountInput.current.value;
        const password = passwordInput.current.value;

        props.history.push("/");

        return;
        login(account, password)
            .then((resp) => {
                console.log(resp);
            })
            .catch((reason) => {
                console.log(reason);
            });
    }

    return (
        <Grid container justifyContent={"center"}>
            <Paper variant={"outlined"} >
                <Box width={"400px"} padding={"16px"}>
                    <Grid container justifyContent={"center"} marginTop={"20px"}>
                        <Avatar sizes={"100px"}/>
                    </Grid>
                    <Typography variant="h4" style={{marginTop: "30px", marginBottom: "16px"}}>
                        Sign In
                    </Typography>

                    <TextField inputRef={accountInput}  required autoFocus margin="dense" id="account" label="Account" type="text"
                               fullWidth/>
                    <TextField inputRef={passwordInput} required margin="dense" id="password" label="Password" type="text"
                               fullWidth/>
                </Box>
                <Grid container padding={"0px 16px 32px 16px"}>
                    <Grid item xs={12}>
                        <Grid container justifyContent={"right"}>
                            <Link href="/reset">Forgot Password?</Link>
                            <span>&nbsp;&nbsp;or&nbsp;&nbsp;</span>
                            <Link href="/signup">Register</Link>
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