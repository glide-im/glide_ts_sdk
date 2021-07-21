import {Divider, List, ListItem, ListItemText} from "@material-ui/core";
import React from "react";

export function ChatList() {

    return <>
        <List style={{overflow: "auto", height: "700px"}}>
            <ListItem>
                <ListItemText primary={"1"}/>
            </ListItem>
            <Divider/>
            <ListItem>
                <ListItemText primary={"2"}/>
            </ListItem>
            <Divider/>
            <ListItem>
                <ListItemText primary={"3"}/>
            </ListItem>
            <Divider/>
            <ListItem>
                <ListItemText primary={"4"}/>
            </ListItem>
        </List>
    </>
}
