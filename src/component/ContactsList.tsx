import {Box, Divider, Grid, IconButton, List, ListItem, ListItemText, Typography} from "@material-ui/core";
import React, {useEffect, useState} from "react";
import {client} from "../im/client";
import {Refresh} from "@material-ui/icons";
import {AddContactDialog} from "./AddContactDialog";
import {ContactsItem} from "./ContactsItem";

export function ContactsList() {

    const [contacts, setContacts] = useState([...client.contacts])
    const [showAddContact, setShowAddContact] = useState(false)

    useEffect(() => {
        client.setContactChangeListener(contacts => {
            setContacts([...contacts])
        })
        return () => client.setContactChangeListener(null)
    }, [])

    const list = contacts?.flatMap(value => {
            if (value.Id === client.getMyUid()) {
                return <></>
            }
            return (<ContactsItem contact={value}/>)
        }
    )

    const refresh = () => {
        client.updateContacts().then()
    }

    const addContactHandler = (isGroup: boolean, id: number) => {
        if (!isGroup) {
            client.addFriend(id).then()
        } else {
            client.joinGroup(id).then()
        }
        setShowAddContact(false)
    }

    return <Grid container style={{height: "700px"}}>
        <Grid item md={4}>
            <Box m={2}>
                <AddContactDialog open={showAddContact} onClose={() => setShowAddContact(false)}
                                  onSubmit={addContactHandler}/>
                <Typography variant={"caption"}>Contacts</Typography>
                <IconButton size={"small"} onClick={refresh}>
                    <Refresh/>
                </IconButton>
            </Box>
            <Divider/>
            <List style={{overflow: "auto"}}>
                <ListItem key={"add_contacts"} button onClick={() => {
                    setShowAddContact(true)
                }}>
                    <ListItemText primary={"Add Contacts"}/>
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
