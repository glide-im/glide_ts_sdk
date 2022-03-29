import {Avatar, ListItem, ListItemIcon, ListItemText} from "@mui/material";
import {client} from "../im/client";
import React from "react";
import {IContacts} from "../im/message";
import {RouteComponentProps, withRouter} from "react-router-dom";


interface Props extends RouteComponentProps {
    contact: IContacts
    onClick?: (id: number) => void
}

export const ContactsItem = withRouter((props: Props) => {

    const handleClick = () => {

    }

    return <>
        <ListItem button key={`${props.contact.Type}-${props.contact.Id}`} onClick={handleClick}>
            <ListItemIcon>
                <Avatar src={props.contact.Avatar}/>
            </ListItemIcon>
            <ListItemText primary={`${props.contact.Name}-${props.contact.Id}`}/>
        </ListItem>

    </>
})

