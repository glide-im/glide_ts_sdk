import GitHubIcon from '@mui/icons-material/GitHub';
import SettingsIcon from '@mui/icons-material/Settings';
import { Avatar, Box, Button, Grid, IconButton, Paper, TextField, Typography } from "@mui/material";
import React, { useRef, useState } from "react";
import { Link as RtLink, RouteComponentProps, withRouter } from "react-router-dom";
import { Account } from "../../im/account";
import { SettingDialog } from './SettingsDialog';

export const Auth = withRouter((props: RouteComponentProps) => {

    const accountInput = useRef<HTMLInputElement>(null)
    const passwordInput = useRef<HTMLInputElement>(null)

    const token = Account.getInstance().getToken()
    const [open, setOpen] = useState(false)

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
                    console.log(r)
                },
                error: (e) => {
                    alert(e.message)
                },
                complete: () => {
                    props.history.push("/im");
                }
            })
    }

    const onSettingClick = () => {
        setOpen(true)
    }

    const onGithubClick = () => {
        window.open("https://github.com/Glide-IM/Glide-IM-Web")
    }

    return (
        <Grid container justifyContent={"center"}>
            <SettingDialog show={open} onClose={() => { setOpen(false) }} />
            <Box style={{ position: "absolute", display: "block", top: "10px", right: "10px" }}>
                <IconButton onClick={onSettingClick}>
                    <SettingsIcon />
                </IconButton>
                <IconButton onClick={onGithubClick}>
                    <GitHubIcon />
                </IconButton>
            </Box>
            <Paper variant={"outlined"}>
                <Box width={"400px"} padding={"16px"}>
                    <Grid container justifyContent={"center"} marginTop={"20px"}>
                        <Avatar sizes={"100px"} />
                    </Grid>
                    <Typography variant="h4" style={{ marginTop: "30px", marginBottom: "16px" }}>
                        Sign In
                    </Typography>

                    <TextField inputRef={accountInput} required autoFocus margin="dense" id="account" label="Account"
                        type="text"
                        fullWidth />
                    <TextField inputRef={passwordInput} required margin="dense" id="password" label="Password"
                        type="password"
                        fullWidth />
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
                            <Button variant="contained" color="primary" style={{ marginTop: "20px" }} onClick={submit}>
                                Submit
                            </Button>
                        </Grid>
                    </Grid>
                </Grid>
            </Paper>
        </Grid>
    )
});
