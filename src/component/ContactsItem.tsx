import {Avatar, ListItem, ListItemIcon, ListItemText} from "@mui/material";
import React from "react";
import {RouteComponentProps, withRouter} from "react-router-dom";
import {Contacts} from "../im/contacts";


interface Props extends RouteComponentProps {
    contact: Contacts;
    onClick?: (id: number) => void
}

export const ContactsItem = withRouter((props: Props) => {

    const c = props.contact;
    const handleClick = () => {
        props.history.push(`./session/${c.getSID()}`);
    }

    return <>
        <ListItem button key={`${c.type}-${c.id}`} onClick={handleClick}>
            <ListItemIcon>
                <Avatar src={c.avatar}/>
            </ListItemIcon>
            <ListItemText primary={c.name}/>
        </ListItem>

    </>
})

