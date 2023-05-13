import {Avatar, Badge, ListItemButton, ListItemIcon, ListItemText, ListSubheader} from "@mui/material";
import {green} from "@mui/material/colors";
import {useEffect, useState} from "react";
import {showSnack} from "../widget/SnackBar";
import {useParams} from "react-router-dom";
import {ISession, SessionType} from "../../im/session";

export function SessionListItem(props: { chat: ISession, onSelect: (c: ISession) => void }) {

    const {sid} = useParams<{ sid: string }>();
    const [msg, setMsg] = useState(props.chat.LastMessage)
    const [unread, setUnread] = useState(props.chat.UnreadCount)

    useEffect(() => {
        const sp = props.chat.messageSubject.subscribe((msg) => {
            if (!msg.FromMe && props.chat.ID !== sid) {
                if (props.chat.Type === SessionType.Channel) {
                    showSnack(`[${props.chat.Title}] ${msg.getSenderName()}: ${props.chat.LastMessage}`)
                } else {
                    showSnack(`${props.chat.Title}: ${props.chat.LastMessage}`)
                }
            }
        })
        return () => sp.unsubscribe()
    }, [props.chat, sid])

    useEffect(() => {
        console.log("SessionListItem", "init", props.chat)
        const sp = props.chat.updateSubject.subscribe({
            next: (s) => {
                console.log("SessionListItem", "chat updated", props.chat)
                setMsg(`${props.chat.LastMessageSender}: ${props.chat.LastMessage}`)
                setUnread(props.chat.UnreadCount)
            }
        })
        return () => sp.unsubscribe()
    }, [props.chat])

    const onItemClick = () => {
        props.onSelect(props.chat)
    }

    return <>
        <ListItemButton style={{cursor: "pointer"}} sx={{bgcolor: 'background.paper'}} onClick={onItemClick}
                        selected={props.chat.ID === sid}>
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
