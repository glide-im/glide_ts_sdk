import {Avatar, ListItem, ListItemIcon, ListItemText} from "@material-ui/core";
import {client} from "../im/client";
import React from "react";
import {Contacts} from "../im/message";
import {RouteComponentProps, withRouter} from "react-router-dom";


interface Props extends RouteComponentProps {
    contact: Contacts
    onClick?: (id: number) => void
}

export const ContactsItem = withRouter((props: Props) => {

    const handleClick = () => {
        const chat = client.chatList.getChatByTarget(props.contact.Id, props.contact.Type)
        if (!chat) {
            client.chatList.startChat(props.contact.Id, props.contact.Type)
                .then(() => {
                    props.history.push("/message")
                })
        } else {
            client.chatList.setCurrentChat(chat)
            props.history.push("/message")
        }
    }

    return <>
        <ListItem button key={`${props.contact.Type}-${props.contact.Id}`} onClick={handleClick}>
            <ListItemIcon>
                <Avatar src={""}/>
            </ListItemIcon>
            <ListItemText primary={props.contact.Name}/>
        </ListItem>

    </>
})

