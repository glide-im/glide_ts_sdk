import * as React from 'react';
import { useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Paper, { PaperProps } from '@mui/material/Paper';
import Draggable from 'react-draggable';
import { IconButton } from '@mui/material';
import { VideoCallRounded } from '@mui/icons-material';
import { WebRTC } from '../../webrtc/webrtc';
import { WebRtcView } from './WebRTC';
import { Subscription } from 'rxjs';
import { SessionType } from '../../im/session';
import { Account } from '../../im/account';

export function PaperComponent(props: PaperProps) {
    return (
        <Draggable
            handle='#draggable-dialog-title'
            cancel={'[class*="MuiDialogContent-root"]'}>
            <Paper {...props} />
        </Draggable>
    );
}

export default function VideoChat(props: {
    session: string;
    showIcon: boolean;
}) {
    const [open, setOpen] = React.useState(false);

    useEffect(() => {
        let sp: Subscription | null = null;
        if (!props.showIcon) {
            WebRTC.onIncoming((peerInfo, incoming) => {
                sp = incoming.cancelEvent.subscribe(() => {
                    setOpen(false);
                    sp.unsubscribe();
                });
                setOpen(true);
            });
        }
        return () => sp?.unsubscribe();
    }, [props.showIcon]);

    const session = Account.session().get(props.session);
    if (session?.Type !== SessionType.Single) {
        return <></>;
    }

    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    return (
        <div>
            {props.showIcon ? (
                <IconButton onClick={handleClickOpen}>
                    <VideoCallRounded />
                </IconButton>
            ) : (
                <></>
            )}
            <Dialog
                open={open}
                onClose={handleClose}
                PaperComponent={PaperComponent}
                aria-labelledby='draggable-dialog-title'>
                <DialogTitle
                    style={{ cursor: 'move' }}
                    id='draggable-dialog-title'>
                    视频通话
                </DialogTitle>
                <DialogContent>
                    <WebRtcView targetId={session.To} onClose={handleClose} />
                </DialogContent>
            </Dialog>
        </div>
    );
}
