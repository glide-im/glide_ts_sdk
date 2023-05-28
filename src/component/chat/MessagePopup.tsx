import {Box, Menu, MenuItem} from "@mui/material";
import React, {useRef} from "react";
import {ChatMessage} from "../../im/chat_message";
import {Event, EventBus} from "../EventBus";

export function MessagePopup(props: { children: JSX.Element, msg: ChatMessage }) {

    const [location, setLocation] = React.useState<{
        mouseX: number;
        mouseY: number;
    } | null>(null);

    const anchorEl = useRef<HTMLElement>()
    const menuRef = useRef<HTMLDivElement>()

    const handleClose = () => {
        setLocation(null);
    }

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault()
        setLocation(location === null ? {
            mouseX: e.clientX - 2,
            mouseY: e.clientY - 4,
        } : null)
    }

    const handleReply = () => {
        EventBus.post(Event.ReplyMessage, props.msg)
        handleClose()
    }

    menuRef?.current?.addEventListener("contextmenu", (e) => {
        setLocation(null)
        e.preventDefault()
    })

    return <>
        <Menu
            anchorReference="anchorPosition"
            anchorPosition={
                location !== null ? {top: location.mouseY, left: location.mouseX} : undefined
            }
            ref={menuRef}
            id="menu-appbar"
            anchorEl={anchorEl.current}
            keepMounted
            open={Boolean(anchorEl) && location !== null}
            onClose={handleClose}
        >
            {props.msg.FromMe ? <MenuItem disabled><Box mx={1}>撤回</Box></MenuItem> : null}
            <MenuItem disabled><Box mx={1}>转发</Box>
            </MenuItem>
            <MenuItem onClick={handleReply}><Box mx={1}>回复</Box>
            </MenuItem>
            <MenuItem disabled><Box mx={1}>删除</Box>
            </MenuItem>
        </Menu>
        <Box onContextMenu={handleContextMenu} bgcolor={location !== null ? "rgba(65,65,65,0.15)" : ""} width={"100%"}>
            {props.children}
        </Box>
    </>
}