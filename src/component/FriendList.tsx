import {
    Avatar,
    Box,
    Divider,
    Grid,
    IconButton,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Typography
} from "@material-ui/core";
import React, {useEffect, useState} from "react";
import {client} from "../im/client";
import {UserInfo} from "../im/message";
import {Refresh} from "@material-ui/icons";

const emptyUser: UserInfo[] | null = []

export function FriendList(prop: { onSelectUser: (uid: number) => void }) {

    const [users, setUsers] = useState(emptyUser)

    useEffect(() => {

    }, [])

    const list = users?.flatMap(value => {
            if (value.Uid === client.getMyUid()) {
                return <></>
            }
            return (
                <>
                    <ListItem style={{cursor: "pointer"}} key={value.Account} onClick={() => {
                        client.chatList.startChat(value.Uid, 1, () => {
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
        }
    )

    const refresh = () => {
        client.getAllOnlineUser((r) => {
            setUsers(() => r)
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
        <Grid item md={8} >
            <Typography variant={"h5"}>Friends</Typography>
        </Grid>
    </Grid>
}
