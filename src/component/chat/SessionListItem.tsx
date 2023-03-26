import {Avatar, Badge, ListItemButton, ListItemIcon, ListItemText} from "@mui/material";
import {green} from "@mui/material/colors";
import {useEffect, useState} from "react";
import {Session} from "src/im/session";

export function SessionListItem(props: { chat: Session, selected: boolean, onSelect: (c: Session) => void }) {

    const [msg, setMsg] = useState(props.chat.LastMessage)

    useEffect(() => {
        console.log("SessionListItem", "init", props.chat)
        props.chat.setSessionUpdateListener(() => {
            console.log("SessionListItem", "chat updated", props.chat)
            setMsg(props.chat.LastMessage)
        })
    }, [props.chat])

    const onItemClick = () => {
        props.chat.clearUnread()
        props.onSelect(props.chat)
    }

    let lastMsg = msg
    if (props.chat.isGroup() || props.chat.LastMessageSender === 'me') {
        lastMsg = `${props.chat.LastMessageSender}: ${props.chat.LastMessage}`
    }

    if (lastMsg === undefined || lastMsg.length === 0) {
        lastMsg = '-'
    }

    if (lastMsg.length > 30) {
        lastMsg = lastMsg.substring(0, 30) + " ..."
    }
    const selected = window.location.hash.indexOf(`/${props.chat.ID}`) !== -1

    return <>
        <ListItemButton style={{cursor: "pointer"}} sx={{bgcolor: 'background.paper'}} onClick={onItemClick}
                        selected={selected}>
            <ListItemIcon>
                <Badge variant={'dot'} badgeContent={props.chat.UnreadCount} overlap="rectangular" color={"secondary"}>
                    <Avatar variant="rounded" sx={{bgcolor: green[500]}} src={props.chat.Avatar}/>
                </Badge>
            </ListItemIcon>
            <ListItemText primary={props.chat.Title} secondary={lastMsg}/>
        </ListItemButton>
    </>
}
