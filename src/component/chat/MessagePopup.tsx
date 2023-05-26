import {Box, Menu, MenuItem} from "@mui/material";
import {DescriptionOutlined} from "@mui/icons-material";
import React, {useRef} from "react";
import {ChatMessage} from "../../im/chat_message";

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

    const handleContextMenu = (e: React.MouseEvent)=>{
        e.preventDefault()
        setLocation(location === null ? {
            mouseX: e.clientX - 2,
            mouseY: e.clientY - 4,
        } : null)
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
            <MenuItem disabled><Box >撤回</Box>
            </MenuItem>
            <MenuItem disabled><Box >转发</Box>
            </MenuItem>
            <MenuItem disabled><Box >回复</Box>
            </MenuItem>
            <MenuItem disabled><Box >删除</Box>
            </MenuItem>
        </Menu>
        <Box onContextMenu={handleContextMenu} bgcolor={location !== null ? "rgba(65,65,65,0.15)" : ""} width={"100%"}>
            {props.children}
        </Box>
    </>
}