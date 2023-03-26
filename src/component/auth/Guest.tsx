import {Account} from "../../im/account";
import {RouteComponentProps, withRouter} from "react-router-dom";
import {Avatar, Button, Grid, Paper, TextField} from "@mui/material";
import {Version} from "../version";
import React, {useRef} from "react";

export const Guest = withRouter((props: RouteComponentProps) => {

    const accountInput = useRef<HTMLInputElement>(null)

    const onSubmit = () => {
        Account.getInstance().guest(accountInput.current.value, '').subscribe({
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
            <Paper variant={"outlined"}>
                <Grid container sx={{p: 2}} p={2}>
                    <Grid container>
                        <Grid container justifyContent={"center"} mt={2}>
                            <Avatar sizes={"100px"}/>
                        </Grid>

                        <Grid container justifyContent={"center"} mt={2}>
                            <TextField inputRef={accountInput} required autoFocus margin="dense" id="account"
                                       label="输入一个好听的昵称"
                                       type="text"
                                       fullWidth/>
                        </Grid>
                    </Grid>
                    <Grid container mt={4} mb={2}>
                        <Grid xs={8}>
                            <Button onClick={() => props.history.push('/auth/signup')} disabled={true}>注册账号</Button>
                        </Grid>
                        <Grid xs={4} justifyContent={"right"} display={"flex"}>
                            <Button variant="contained" color="primary" onClick={onSubmit}>游客登录</Button>
                        </Grid>
                    </Grid>
                </Grid>
                <Version/>
            </Paper>
        </Grid>
    )
})