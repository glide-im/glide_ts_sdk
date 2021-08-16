import {Box, Divider, Grid, IconButton, List, ListItem, ListItemText, Typography} from "@material-ui/core";
import React, {useEffect, useState} from "react";
import {client} from "../im/client";
import {GroupAdd, Refresh} from "@material-ui/icons";
import {AddContactDialog} from "./AddContactDialog";
import {ContactsItem} from "./ContactsItem";
import {CreateGroupDialog} from "./CreateGroupDialog";

export function ContactsList() {

    const contactsList = client.contactsList

    const [contacts, setContacts] = useState([...contactsList.getAllContacts()])

    const [showAddContact, setShowAddContact] = useState(false)
    const [showCreateGroup, setShowCreateGroup] = useState(false)

    useEffect(() => {
        client.contactsList.onContactsChange = () => {
            setContacts([...contactsList.getAllContacts()])
        }
        return () => client.contactsList.onContactsChange = null
    }, [contactsList])

    const list = contacts?.flatMap(value => {
            return (<ContactsItem contact={value}/>)
        }
    )

    const refresh = () => {
        client.contactsList.updateAll().then()
    }

    const createGroup = (name: string) => {
        client.createGroup(name)
            .then()
        setShowCreateGroup(false)
    }

    const addContactHandler = (isGroup: boolean, id: number) => {
        if (!isGroup) {
            client.contactsList.addFriend(id)
                .then()
        } else {
            client.joinGroup(id).then()
        }
        setShowAddContact(false)
    }

    return <Grid container style={{height: "700px"}}>
        <Grid item md={4}>
            <Box m={2}>
                <CreateGroupDialog open={showCreateGroup} onClose={() => setShowCreateGroup(false)}
                                   onSubmit={createGroup}/>
                <AddContactDialog open={showAddContact} onClose={() => setShowAddContact(false)}
                                  onSubmit={addContactHandler}/>
                <Typography variant={"caption"}>Contacts</Typography>

                <IconButton size={"small"} onClick={refresh} style={{float: "right"}}>
                    <Refresh/>
                </IconButton>

                <IconButton size={"small"} onClick={() => setShowCreateGroup(true)} style={{float: "right"}}>
                    <GroupAdd/>
                </IconButton>
            </Box>
            <Divider/>
            <List style={{overflow: "auto", maxHeight: "600px"}}>
                <ListItem key={"add_contacts"} button onClick={() => setShowAddContact(true)}>
                    <ListItemText primary={"Add ContactsList"}/>
                </ListItem>
                <Divider/>

                {list}
            </List>
        </Grid>
        <Grid item md={8}>
            <Divider orientation={"vertical"} style={{float: "left"}}/>
            <Typography variant={"h5"} align={"center"}> </Typography>
        </Grid>
    </Grid>
}
