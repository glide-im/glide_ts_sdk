import {Avatar, Box, Button, Grid, Paper, TextField, Typography} from "@mui/material";
import React, {useRef} from "react";
import {RouteComponentProps, withRouter} from "react-router-dom";
import {showSnack} from "../widget/SnackBar";
import { Api } from "../../api/api";

export const Register = withRouter((props: RouteComponentProps) => {

    const accountInput = useRef<HTMLInputElement>(null)
    const passwordInput = useRef<HTMLInputElement>(null)
    const codeInput = useRef<HTMLInputElement>(null)
    const nicknameInput = useRef<HTMLInputElement>(null)

    const sendCode = () => {
        Api.verifyCode(accountInput.current.value).subscribe({
            error: (e) => {
                showSnack(e.toString())
            },
            complete: () => {
                showSnack("发送成功")
            }
        })
    }

    const submit = () => {
        const account = accountInput.current.value;
        const password = passwordInput.current.value;
        const nickname = nicknameInput.current.value;

        Api.register(account, nickname, codeInput.current.value, password)
            .then((resp) => {
                showSnack("注册成功");
                props.history.replace("/auth");
            })
            .catch((reason) => {
                alert(reason)
            });
    }

    return (
        <Grid container justifyContent={"center"}>
            <Paper variant={"outlined"}>
                <Box width={"400px"} padding={"16px"}>
                    <Grid container justifyContent={"center"} mt={2}>
                        <Avatar sizes={"100px"}/>
                    </Grid>
                    <Typography variant="h5">
                        注册账号
                    </Typography>

                    <TextField inputRef={accountInput} required autoFocus margin="dense" id="account" label="邮箱"
                               type="text"
                               fullWidth/>
                    <Grid container justifyContent={"center"}>
                        <Grid item xs={9}>
                            <TextField inputRef={codeInput} required margin="dense" id="code" label="验证码" type="text"
                                       fullWidth/>
                        </Grid>
                        <Grid item xs={3} justifyContent={'center'} mt={1} mb={1} display={"flex"}>
                            <Button onClick={sendCode} size={"medium"}>发送验证码</Button>
                        </Grid>
                    </Grid>
                    <TextField inputRef={passwordInput} required margin="dense" id="password" label="密码"
                               type="password"
                               fullWidth/>
                    <TextField inputRef={nicknameInput} required margin="dense" id="nickname"
                               label="昵称"
                               type="text"
                               fullWidth/>
                </Box>
                <Grid container padding={"0px 16px 32px 16px"}>
                    <Grid item xs={12}>
                        <Grid container justifyContent={"right"}>
                            <Button onClick={() => props.history.replace('/auth/signin')}>返回登录</Button>
                            <Button variant="contained" color="primary" onClick={submit}>提交</Button>
                        </Grid>
                    </Grid>
                </Grid>
            </Paper>
        </Grid>
    )
})