import GitHubIcon from '@mui/icons-material/GitHub';
import SettingsIcon from '@mui/icons-material/Settings';
import {Avatar, Box, Button, Grid, IconButton, Paper, TextField, Typography} from "@mui/material";
import React, {useRef, useState} from "react";
import {RouteComponentProps, withRouter} from "react-router-dom";
import {Account} from "../../im/account";
import {SettingDialog} from './SettingsDialog';
import {showSnack} from "../widget/SnackBar";

export const Auth = withRouter((props: RouteComponentProps) => {

    const accountInput = useRef<HTMLInputElement>(null)
    const passwordInput = useRef<HTMLInputElement>(null)

    const token = Account.getInstance().token
    const [open, setOpen] = useState(false)

    if (token) {
        props.history.replace("/im");
        return <></>
    }

    const submit = () => {
        const account = accountInput.current.value;
        const password = passwordInput.current.value;

        Account.getInstance()
            .login(account, password)
            .subscribe({
                error: (e) => {
                    console.log(e);
                    showSnack("登录失败：" + e.message ?? e)
                },
                complete: () => {
                    props.history.replace("/im");
                }
            })
    }

    const onSettingClick = () => {
        setOpen(true)
    }

    const onGithubClick = () => {
        window.open("https://github.com/glide-im/glide_ts_sdk")
    }

    const onGuestClick = () => {
        props.history.replace('/auth/guest')
    }

    return (
        <Grid container justifyContent={"center"}>
            <SettingDialog show={open} onClose={() => {
                setOpen(false)
            }}/>
            <Box style={{position: "absolute", display: "block", top: "10px", right: "10px"}}>
                <IconButton onClick={onSettingClick}>
                    <SettingsIcon/>
                </IconButton>
                <IconButton onClick={onGithubClick}>
                    <GitHubIcon/>
                </IconButton>
            </Box>
            <Paper variant={"outlined"}>
                <Box width={"400px"} padding={"16px"}>
                    <Grid container justifyContent={"center"} mt={2}>
                        <Avatar sizes={"100px"}/>
                    </Grid>
                    <Typography variant="h4" mt={2} mb={2}>

                    </Typography>

                    <TextField inputRef={accountInput} required autoFocus margin="dense" id="account" label="账号"
                               type="text"
                               fullWidth/>
                    <TextField inputRef={passwordInput} required margin="dense" id="password" label="密码"
                               type="password"
                               fullWidth/>
                </Box>
                <Grid container padding={"0px 16px 32px 16px"}>
                    <Grid xs={8} item mt={2}>
                        <Button onClick={onGuestClick}>游客登录</Button>
                        <Button onClick={() => props.history.replace('/auth/signup')}>注册账号</Button>
                    </Grid>
                    <Grid xs={4} item justifyContent={"right"} display={"flex"} mt={2}>
                        <Button variant="contained" color="primary" onClick={submit}>登录</Button>
                    </Grid>
                </Grid>
            </Paper>
        </Grid>
    )
});
