import React, {useEffect, useRef} from 'react';
import {rtcConfig, setRtcConfig, WebRTC, WebRtcSessionState} from "../../webrtc/webrtc";
import {Dialing, Incoming, RtcDialog} from "../../webrtc/dialing";
import {Box, Button, Dialog, IconButton, Typography} from "@mui/material";
import {CheckRounded, CloseRounded, PhoneRounded, SettingsRounded} from "@mui/icons-material";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import {showSnack} from "../widget/SnackBar";

function ConfigureDialog() {

    const textRef = useRef<HTMLTextAreaElement | null>(null);
    const [show, setShow] = React.useState(false);

    const onApply = () => {
        if (show) {
            const config = JSON.parse(textRef.current!.value) as RTCConfiguration;
            setRtcConfig(config)
        }
        setShow(!show)
    }

    const handleClose = () => {
        setShow(false)
    }

    return <>
        <Dialog
            open={show}
            onClose={handleClose}
            aria-labelledby="draggable-dialog-title"
        >
            <DialogTitle style={{cursor: 'move'}} id="draggable-dialog-title">
                ICE Server 配置
            </DialogTitle>
            <DialogContent>
                <Box>
                    <textarea ref={textRef} defaultValue={JSON.stringify(rtcConfig)}
                              style={{width: "500px", height: "300px"}}/>
                </Box>
                <Box>
                    <Button onClick={onApply}>
                        应用
                    </Button>
                </Box>
            </DialogContent>
        </Dialog>

        <IconButton onClick={onApply} size={"large"}>
            <SettingsRounded/>
        </IconButton>
    </>
}

export function WebRtcView(props: { targetId: string, onClose: () => void }) {

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const videoTargetRef = useRef<HTMLVideoElement | null>(null);

    const [incoming, setIncoming] = React.useState<Incoming | null>(WebRTC.incoming);
    const [dialing, setDialing] = React.useState<Dialing | null>(null);
    const [call, setCall] = React.useState<RtcDialog | null>(null);

    const [rtcState, setRtcState] = React.useState<WebRtcSessionState>(WebRTC.incoming === null ? "idle" : "incoming");

    useEffect(() => {
        videoRef.current!.onloadedmetadata = () => {
            videoRef.current!.play().then(() => {
                console.log("play")
            }).catch((e) => {
                console.log(e)
            });
        }
    }, [videoRef])

    useEffect(() => {
        videoTargetRef.current!.onloadedmetadata = () => {
            videoTargetRef.current!.play().then(() => {
                console.log("play")
            }).catch((e) => {
                console.log(e)
            });
        }
    }, [videoTargetRef])

    useEffect(() => {
        if (WebRTC.incoming === null) {
            return;
        }
        WebRTC.incoming.peer.onRemoteTrack = (track: RTCTrackEvent) => {
            videoTargetRef.current!.srcObject = track.streams[0];
        }
        let sp = WebRTC.incoming.cancelEvent.subscribe(() => {
            setIncoming(null);
            setRtcState("idle");
            props.onClose();
        })
        return () => sp.unsubscribe()
    }, [props])

    const handleDialog = (dialog: RtcDialog) => {
        dialog.onHangup = () => {
            videoRef.current?.pause()
            videoTargetRef.current?.pause()
            videoRef.current!.srcObject = null;
            videoTargetRef.current!.srcObject = null;
            setRtcState("idle");
            props.onClose();
        }
        setCall(dialog);
        setRtcState("connected");
    }

    const onBtnClick = (reject) => {

        if (reject) {
            incoming?.reject().then(() => {
                setIncoming(null);
            }).catch(e => {
                alert("error" + e);
            }).finally(() => {
                setRtcState("idle");
                props.onClose();
            })
            return;
        }

        switch (rtcState) {
            case "idle":
                WebRTC.dial(props.targetId)
                    .then((dialing) => {
                        dialing.peer.onLocalMediaReady = (stream: MediaStream) => {
                            videoRef.current!.srcObject = stream;
                        }
                        dialing.peer.onRemoteTrack = (track: RTCTrackEvent) => {
                            videoTargetRef.current!.srcObject = track.streams[0];
                        }
                        setDialing(dialing);
                        setRtcState("dialing");
                        dialing.onFail = (msg) => {
                            setDialing(null);
                            setRtcState("idle");
                            showSnack(msg)
                            props.onClose();
                        }
                        dialing.onReject = () => {
                            setRtcState("idle");
                            props.onClose();
                        }
                        dialing.onAccept = (c: RtcDialog) => {
                            handleDialog(c);
                        }
                    })
                    .catch((err) => {
                        alert(err);
                    });
                break;
            case "dialing":
                dialing?.cancel().then(() => {
                    videoRef.current!.pause();
                    videoRef.current!.srcObject = null;
                    setDialing(null);
                    setRtcState("idle");
                    props.onClose();
                });
                break;
            case "incoming":
                incoming?.accept().then((call) => {
                    handleDialog(call);
                }).catch(e => {
                    setRtcState("idle");
                    showSnack(e)
                })
                break;
            case "connected":
                call?.hangup().then(() => {
                    setRtcState("idle");
                    props.onClose();
                });
                break;
        }
    }

    return (<Box className={'container mx-auto'}>
            <div style={{width: "410px", height: "200px"}}>
                <video ref={videoRef} width="200" height="200" controls style={{float: "left"}}/>
                <video ref={videoTargetRef} width="200" height="200" controls style={{float: "right"}}/>
            </div>
            <Typography variant={"body2"}>{rtcState}</Typography>

            <ActionButton state={rtcState} onClick={onBtnClick}/>
        </Box>
    );
}

function ActionButton(props: { state: WebRtcSessionState, onClick: (isReject: Boolean) => void }) {

    let icon = <></>;
    switch (props.state) {
        case "idle":
            icon = <PhoneRounded fontSize={"large"} color={'primary'}/>;
            break;
        case "dialing":
            icon = <CloseRounded color={'warning'}/>;
            break;
        case "incoming":
            icon = <CheckRounded color={'success'}/>;
            break;
        case "connected":
            icon = <CloseRounded color={'warning'}/>;
            break;
    }

    return <Box>
        <ConfigureDialog/>
        <IconButton onClick={() => props.onClick(false)} size={"large"}>
            {icon}
        </IconButton>
        {props.state === "incoming" ? (<IconButton onClick={() => props.onClick(true)} color={'warning'}>
            <CloseRounded/>
        </IconButton>) : <></>}
    </Box>
}

