import React, {useRef} from "react";
import {Avatar, Box, Button, Grid, TextField, Typography} from "@mui/material";
import {register} from "../api/api";

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

        register(account, password)
            .then((resp) => {

            })
            .catch((reason) => {
                alert(reason)
            });
    }

    return (
        <Grid container justifyContent={"center"}>
            <Box style={{border: "1px solid gray", borderRadius: "5px"}} width={"400px"}
                 padding={"16px"}>
                <Box>
                    <Grid container justifyContent={"center"} marginTop={"20px"}>
                        <Avatar sizes={"100px"}/>
                    </Grid>
                    <Typography variant="h4" style={{marginTop: "30px", marginBottom: "16px"}}>
                        Register
                    </Typography>

                    <TextField inputRef={accountInput} required autoFocus margin="dense" id="account" label="Account"
                               type="text"
                               fullWidth/>
                    <TextField inputRef={passwordInput} required margin="dense" id="password" label="Password"
                               type="text"
                               fullWidth/>
                    <TextField inputRef={passwordAgainInput} required margin="dense" id="password"
                               label="Password Again"
                               type="text"
                               fullWidth/>
                </Box>
                <Grid container>
                    <Grid item xs={12}>
                        <Grid container justifyContent={"right"}>
                            <Button variant="contained" color="primary"
                                    style={{marginTop: "30px", marginBottom: "20px"}} onClick={submit}>
                                Submit
                            </Button>
                        </Grid>
                    </Grid>
                </Grid>
            </Box>
        </Grid>
    )
}