import GitHubIcon from '@mui/icons-material/GitHub';
import SettingsIcon from '@mui/icons-material/Settings';
import {Avatar, Box, Button, Grid, IconButton, Paper, TextField, Typography} from "@mui/material";
import React, {useRef, useState} from "react";
import {RouteComponentProps, withRouter} from "react-router-dom";
import {Account} from "../../im/account";
import {Version} from '../version';
import {SettingDialog} from './SettingsDialog';

export const Auth = withRouter((props: RouteComponentProps) => {

    const accountInput = useRef<HTMLInputElement>(null)
    const passwordInput = useRef<HTMLInputElement>(null)

    const token = Account.getInstance().token
    const [open, setOpen] = useState(false)

    if (token) {
        props.history.push("/im");
        return <></>
    }

    const submit = () => {
        const account = accountInput.current.value;
        const password = passwordInput.current.value;

        Account.getInstance()
            .login(account, password)
            .subscribe({
                next: (r) => {
                    console.log(r)
                },
                error: (e) => {
                    alert(e)
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
        window.open("https://github.com/glide-im/glide_ts_sdk")
    }

    const onGuestClick = () => {
        Account.getInstance().guest('', '').subscribe({
            error: (e) => {
                alert(e)
            },
            complete: () => {
                props.history.push('/im')
            }
        })
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
                    <Grid xs={8} mt={2}>
                        <Button onClick={onGuestClick}>游客登录</Button>
                        <Button onClick={() => props.history.push('/auth/signup')}>注册账号</Button>
                    </Grid>
                    <Grid xs={4} justifyContent={"right"} display={"flex"} mt={2}>
                        <Button variant="contained" color="primary" onClick={submit}>登录</Button>
                    </Grid>
                </Grid>
                <Version/>
            </Paper>
        </Grid>
    )
});
