import { Avatar, Box, Button, Grid, Paper, TextField, Typography } from "@mui/material";
import React, { useRef } from "react";
import { Link as RtLink } from "react-router-dom";
import { Api } from "../api/api";

export function Register() {

    const accountInput = useRef<HTMLInputElement>(null)
    const passwordInput = useRef<HTMLInputElement>(null)
    const passwordAgainInput = useRef<HTMLInputElement>(null)

    const submit = () => {
        const account = accountInput.current.value;
        const password = passwordInput.current.value;
        const passwordAgain = passwordAgainInput.current.value;

        if (password !== passwordAgain) {
            alert("两次输入的密码不一致");
            return;
        }

        Api.register(account, password)
            .then((resp) => {

            })
            .catch((reason) => {
                alert(reason)
            });
    }

    return (
        <Grid container justifyContent={"center"}>
            <Paper variant={"outlined"}>
                <Box width={"400px"} padding={"16px"}>
                    <Grid container justifyContent={"center"} marginTop={"20px"}>
                        <Avatar sizes={"100px"} />
                    </Grid>
                    <Typography variant="h4" style={{ marginTop: "30px", marginBottom: "16px" }}>
                        Register
                    </Typography>

                    <TextField inputRef={accountInput} required autoFocus margin="dense" id="account" label="Account"
                        type="text"
                        fullWidth />
                    <TextField inputRef={passwordInput} required margin="dense" id="password" label="Password"
                        type="text"
                        fullWidth />
                    <TextField inputRef={passwordAgainInput} required margin="dense" id="password"
                        label="Password Again"
                        type="text"
                        fullWidth />
                </Box>
                <Grid container padding={"0px 16px 32px 16px"}>
                    <Grid item xs={12}>
                        <Grid container justifyContent={"right"}>
                            <RtLink to={"./signin"}>
                               Back to Login
                            </RtLink>
                        </Grid>
                        <Grid container justifyContent={"right"}>
                            <Button variant="contained" color="primary"
                                style={{ marginTop: "40px", marginBottom: "20px" }} onClick={submit}>
                                Submit
                            </Button>
                        </Grid>
                    </Grid>
                </Grid>
            </Paper>
        </Grid>
    )
}
