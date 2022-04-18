import { GroupAdd, Refresh } from "@mui/icons-material";
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
} from "@mui/material";
import { grey } from "@mui/material/colors";
import React, { useEffect, useState } from "react";
import { RouteComponentProps, withRouter } from "react-router-dom";
import { Account } from "src/im/account";
import { Contacts } from "../../im/contacts";
import { AddContactDialog } from "./AddContactDialog";
import { CreateGroupDialog } from "./CreateGroupDialog";

export function ContactsList() {

    const [contacts, setContacts] = useState([])

    const [showAddContact, setShowAddContact] = useState(false)
    const [showCreateGroup, setShowCreateGroup] = useState(false)

    const c = Account.getInstance().getContactList()

    useEffect(() => {
        c.getContactList()
            .subscribe({
                next: (list: Contacts[]) => {
                    setContacts(list)
                },
                error: (err) => {
                    console.log(err)
                }
            })
        c.setContactsUpdateListener(() => {
            setContacts([...c.getAllContacts()])
        })
        return () => c.setContactsUpdateListener(null)
    }, [c])

    const list = contacts.flatMap(value => {
        return (<ContactsItem contact={value} key={value.id} />)
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
            c.addFriend(id, "")
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

    return <Grid container style={{ height: "700px" }}>
        <Grid item xs={4}>
            <Box m={2}>
                <CreateGroupDialog open={showCreateGroup} onClose={() => setShowCreateGroup(false)}
                    onSubmit={createGroup} />
                <AddContactDialog open={showAddContact} onClose={() => setShowAddContact(false)}
                    onSubmit={addContactHandler} />
                <Typography variant={"caption"}>联系人</Typography>

                <IconButton size={"small"} onClick={refresh} style={{ float: "right" }}>
                    <Refresh />
                </IconButton>

                <IconButton size={"small"} onClick={() => setShowCreateGroup(true)} style={{ float: "right" }}>
                    <GroupAdd />
                </IconButton>
            </Box>
            <Divider />
            <List style={{ overflow: "auto", maxHeight: "600px" }}>
                <ListItem key={"add_contacts"} button onClick={() => setShowAddContact(true)}>
                    <ListItemText primary={"Add ContactsList"} />
                </ListItem>
                <Divider />

                {list}

            </List>
        </Grid>
        <Grid item xs={8}>
            <Divider orientation={"vertical"} style={{ float: "left" }} />
            <Typography variant={"h5"} align={"center"}> </Typography>
        </Grid>
    </Grid>
}


interface Props extends RouteComponentProps {
    contact: Contacts;
    onClick?: (id: number) => void
}

export const ContactsItem = withRouter((props: Props) => {

    const c = props.contact;
    const handleClick = () => {
        props.history.push(`./session/${c.id}`);
    }

    return <>
        <ListItem button key={`${c.type}-${c.id}`} onClick={handleClick}>
            <ListItemIcon>
                <Avatar variant="rounded" sx={{ bgcolor: grey[500] }} src={c.avatar} />
            </ListItemIcon>
            <ListItemText primary={c.name} />
        </ListItem>

    </>
})

