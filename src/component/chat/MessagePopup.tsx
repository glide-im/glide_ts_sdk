import {Box, Menu, MenuItem} from "@mui/material";
import {DescriptionOutlined} from "@mui/icons-material";
import React, {useEffect} from "react";
import {ChatMessage} from "../../im/chat_message";

export function MessagePopup(props: { anchorEl: HTMLElement, msg: ChatMessage }) {

    const [event, setEvent] = React.useState<null | MouseEvent>(null);

    const handleClose = () => {
        setEvent(null);
    }

    useEffect(() => {
        if (!props.anchorEl) {
            return
        }
        props.anchorEl.addEventListener("contextmenu", (e) => {
            e.preventDefault()
            console.log(e)
            setEvent(e)
        })

    }, [props.anchorEl])

    return <>
        <Menu
            id="menu-appbar"
            anchorEl={props.anchorEl}
            anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
            }}
            open={Boolean(props.anchorEl) && event !== null}
            onClose={handleClose}
        >
            <MenuItem disabled>
                <DescriptionOutlined/><Box m={1}>撤回</Box>
            </MenuItem>
            <MenuItem disabled>
                <DescriptionOutlined/><Box m={1}>删除</Box>
            </MenuItem>
        </Menu>
    </>
}