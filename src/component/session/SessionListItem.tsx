import {Avatar, Badge, ListItemButton, ListItemIcon, ListItemText, ListSubheader} from "@mui/material";
import {green} from "@mui/material/colors";
import {useEffect, useState} from "react";
import {showSnack} from "../widget/SnackBar";
import { Session } from "../../im/session";

export function SessionListItem(props: { chat: Session, onSelect: (c: Session) => void }) {

    const [msg, setMsg] = useState(props.chat.LastMessage)
    const [unread, setUnread] = useState(props.chat.UnreadCount)


    useEffect(() =>
        props.chat.addMessageListener((msg) => {
            if (!msg.FromMe && !props.chat.isSelected()) {
                if (props.chat.isGroup()) {
                    showSnack(`[${props.chat.Title}] ${msg.getSenderName()}: ${props.chat.LastMessage}`)
                } else {
                    showSnack(`${props.chat.Title}: ${props.chat.LastMessage}`)
                }
            }
        })
    )

    useEffect(() => {
        console.log("SessionListItem", "init", props.chat)
        props.chat.setSessionUpdateListener(() => {
            console.log("SessionListItem", "chat updated", props.chat)
            setMsg(`${props.chat.LastMessageSender}: ${props.chat.LastMessage}`)
            setUnread(props.chat.UnreadCount)
        })
    }, [props.chat])

    const onItemClick = () => {
        props.onSelect(props.chat)
    }

    return <>
        <ListItemButton style={{cursor: "pointer"}} sx={{bgcolor: 'background.paper'}} onClick={onItemClick}
                        selected={props.chat.isSelected()}>
            <ListItemIcon>
                <Badge variant={'standard'} badgeContent={unread} overlap="rectangular"
                       color={"secondary"}>
                    <Avatar variant={'circular'} sx={{bgcolor: green[500]}} src={props.chat.Avatar}/>
                </Badge>
            </ListItemIcon>
            <ListItemText primary={props.chat.Title} secondary={msg}
                          primaryTypographyProps={{style: {color: 'black'}}}
                          secondaryTypographyProps={{
                              style: {
                                  fontSize: 13,
                                  maxLines: 2,
                                  textOverflow: 'ellipsis',
                                  overflow: 'hidden',
                                  maxHeight: '2.6em',
                                  lineClamp: 2,
                              }
                          }}/>
            <ListSubheader sx={{bgcolor: 'transparent'}} disableGutters disableSticky component={'span'}>
                {props.chat.UpdateAt}
            </ListSubheader>
        </ListItemButton>
    </>
}
