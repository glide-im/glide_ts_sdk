import {Avatar, Box, Button, Grid, IconButton, Typography} from "@mui/material";
import React from "react";
import {Account} from "../im/account";
import {RouteComponentProps, withRouter} from "react-router-dom";


export const Profile = withRouter((props: RouteComponentProps) => {

    let u = Account.getInstance().getUserInfo()
    if (u === null) {
        u = {
            avatar: "-", name: "-", uid: "-"
        }
    }

    const logout = () => {
        Account.getInstance().logout()
        props.history.replace("/auth")
    }

    return <Box height={'100%'} position={"relative"}>
        <Grid container justifyContent={"center"}>
            <Box mt={2}>
                <IconButton size={'large'} onClick={() => {
                }}>
                    <Avatar src={u.avatar}/>
                </IconButton>
            </Box>
        </Grid>
        <Box width={"100%"} color={"#666"}>
            <Typography variant={"subtitle1"} color={"black"} textAlign={"center"}>{u.name}</Typography>
            <Typography variant={"subtitle2"} textAlign={"center"}>uid: {u.uid}</Typography>
        </Box>
        <Box bottom={0} position={"absolute"} width={'100%'} p={2} boxSizing={"border-box"}>
            <Button fullWidth variant={"outlined"} size={"large"} onClick={logout}>
                退出登录
            </Button>
        </Box>
    </Box>
})