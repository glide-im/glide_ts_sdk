import {Box, Divider, IconButton, List, ListItem, ListItemText} from "@material-ui/core";
import React, {useEffect, useState} from "react";
import {client} from "../im/client";
import {SearchUser} from "../im/message";
import {Refresh} from "@material-ui/icons";

const emptyUser: SearchUser[] = []

export function ChatList(prop: { onSelectUser: (uid: number) => void }) {

    const [users, setUsers] = useState(emptyUser)

    useEffect(() => {
        client.getChatList((success, result, msg) => {

        })
    }, [])

    const list = users.flatMap(value => (
            <>
                <ListItem style={{cursor: "pointer"}} key={value.Account} onClick={() => {
                    prop.onSelectUser(value.Uid)
                }}>
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

    return <Box style={{height: "700px"}}>
        <Box m={2}>
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
    </Box>
}
