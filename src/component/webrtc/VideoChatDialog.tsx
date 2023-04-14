import * as React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Paper, {PaperProps} from '@mui/material/Paper';
import Draggable from 'react-draggable';
import {IconButton} from "@mui/material";
import {VideoCallRounded} from "@mui/icons-material";
import AppWebRTC from "./WebRTC";
import {Incoming} from "../../webrtc/dialing";
import {WebRTC} from "../../webrtc/webrtc";

function PaperComponent(props: PaperProps) {
    return (
        <Draggable
            handle="#draggable-dialog-title"
            cancel={'[class*="MuiDialogContent-root"]'}
        >
            <Paper {...props} />
        </Draggable>
    );
}

export default function VideoChat() {

    const [open, setOpen] = React.useState(WebRTC.incoming !== null);

    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    if (true){
        // TODO:
        return <></>
    }

    return (
        <div>
            {WebRTC.incoming == null ? <IconButton onClick={handleClickOpen}>
                <VideoCallRounded/>
            </IconButton> : <></>}
            <Dialog
                open={open}
                onClose={handleClose}
                PaperComponent={PaperComponent}
                aria-labelledby="draggable-dialog-title"
            >
                <DialogTitle style={{cursor: 'move'}} id="draggable-dialog-title">
                    视频通话
                </DialogTitle>
                <DialogContent>
                    <AppWebRTC/>
                </DialogContent>
            </Dialog>
        </div>
    );
}