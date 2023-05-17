import {Avatar, Badge, ListItemButton, ListItemIcon, ListItemText, ListSubheader} from "@mui/material";
import {green} from "@mui/material/colors";
import {useEffect, useState} from "react";
import {showSnack} from "../widget/SnackBar";
import {useParams} from "react-router-dom";
import {ISession, SessionBaseInfo, SessionType} from "../../im/session";
import {Logger} from "../../utils/Logger";
import {time2Str} from "../../utils/TimeUtils";

export function SessionListItem(props: { chat: ISession, onSelect: (c: ISession) => void }) {

    const {sid} = useParams<{ sid: string }>();

    const [sessionInfo, setSessionInfo] = useState<SessionBaseInfo>({...props.chat})

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
        Logger.log("SessionListItem", "init", [props.chat])
        const sp = props.chat.event.subscribe({
            next: (s) => {
                Logger.log("SessionListItem", "chat updated", [props.chat])
                setSessionInfo({...props.chat})
            }
        })
        return () => sp.unsubscribe()
    }, [props.chat])

    const onItemClick = () => {
        props.onSelect(props.chat)
    }

    let updateAt = ""
    if (sessionInfo.UpdateAt > 0) {
        updateAt = time2Str(sessionInfo.UpdateAt)
    }

    Logger.log("SessionListItem", "render", [props.chat])

    return <>
        <ListItemButton style={{cursor: "pointer"}} sx={{bgcolor: 'background.paper'}} onClick={onItemClick}
                        selected={sessionInfo.ID === sid}>
            <ListItemIcon>
                <Badge variant={'standard'} badgeContent={sessionInfo.UnreadCount} overlap="rectangular"
                       color={"secondary"}>
                    <Avatar variant={'circular'} sx={{bgcolor: green[500]}} src={sessionInfo.Avatar}/>
                </Badge>
            </ListItemIcon>
            <ListItemText primary={sessionInfo.Title}
                          secondary={`${sessionInfo.LastMessageSender}: ${sessionInfo.LastMessage}`}
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
            <ListSubheader sx={{bgcolor: 'transparent'}} disableGutters disableSticky component={'span'} style={{
                minWidth: '60px',
                textAlign: 'right',
            }}>
                {updateAt}
            </ListSubheader>
        </ListItemButton>
    </>
}
