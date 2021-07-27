import {
    Avatar,
    Box,
    Divider, Grid,
    IconButton,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Typography
} from "@material-ui/core";
import React, {useEffect, useState} from "react";
import {client} from "../im/client";
import {SearchUser} from "../im/message";
import {Refresh} from "@material-ui/icons";

const emptyUser: SearchUser[] | null = []

export function FriendList(prop: { onSelectUser: (uid: number) => void }) {

    const [users, setUsers] = useState(emptyUser)

    useEffect(() => {

    }, [])

    const list = users?.flatMap(value => (
            <>
                <ListItem style={{cursor: "pointer"}} key={value.Account} onClick={() => {
                    client.newChat(value.Uid, 1, () => {
                        prop.onSelectUser(value.Uid)
                    })
                }}>
                    <ListItemIcon>
                        <Avatar/>
                    </ListItemIcon>
                    <ListItemText primary={`${value.Account}-${value.Uid}`}/>
                </ListItem>
                <Divider/>
            </>
        )
    )

    const refresh = () => {
        client.getAllOnlineUser((success, result, msg) => {
            setUsers(() => result)
        })
    }

    return <Grid container style={{height: "700px"}}>
        <Grid item md={4}>
            <Box m={2}>
                <Typography variant={"caption"}>Friends</Typography>
                <IconButton size={"small"} onClick={refresh}>
                    <Refresh/>
                </IconButton>
            </Box>
            <Divider/>
            <List style={{overflow: "auto"}}>
                {list}
                <ListItem>
                    <ListItemText primary={" "}/>
                </ListItem>
            </List>
        </Grid>
        <Grid item md={8} justifyContent={"center"}>
            <Typography variant={"h5"}>Friends</Typography>
        </Grid>
    </Grid>
}
