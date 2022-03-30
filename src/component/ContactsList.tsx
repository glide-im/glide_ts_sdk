import {Box, Divider, Grid, IconButton, List, ListItem, ListItemText, Typography} from "@mui/material";
import React, {useEffect, useState} from "react";
import {GroupAdd, Refresh} from "@mui/icons-material";
import {AddContactDialog} from "./AddContactDialog";
import {ContactsItem} from "./ContactsItem";
import {CreateGroupDialog} from "./CreateGroupDialog";
import {IMContactsList} from "../im/contacts_list";

export function ContactsList() {

    const [contacts, setContacts] = useState([])

    const [showAddContact, setShowAddContact] = useState(false)
    const [showCreateGroup, setShowCreateGroup] = useState(false)

    useEffect(() => {

        IMContactsList.loadContacts()
            .then((r) => {
                setContacts([...r])
            })
            .catch((e) => {
                console.error(e)
            })
        IMContactsList.setContactsAddListener(() => {
            setContacts([...IMContactsList.getAllContacts()])
        })
        return () => IMContactsList.setContactsAddListener(null)
    }, [])

    const list = contacts.flatMap(value => {
            return (<ContactsItem contact={value}/>)
        }
    )

    const refresh = () => {

    }

    const createGroup = (name: string) => {
        // client.createGroup(name)
        //     .then()
        setShowCreateGroup(false)
    }

    const addContactHandler = (isGroup: boolean, id: number) => {
        if (!isGroup) {
            IMContactsList.addFriend(id, "")
                .then((r) => {
                    console.log(r)
                })
                .catch((e) => {
                    console.log(e)
                })
        } else {
            // client.joinGroup(id).then()
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
