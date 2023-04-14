import React, {useEffect, useRef} from 'react';
import {rtcConfig, setRtcConfig, WebRTC, WebRtcSessionState} from "../../webrtc/webrtc";
import {setLogCb} from "../../webrtc/log";
import {Dialing, Dialog, Incoming} from "../../webrtc/dialing";
import {SessionList} from "../../im/session_list";
import {Box, Button, IconButton, Typography} from "@mui/material";
import {CheckRounded, CloseRounded, PhoneRounded} from "@mui/icons-material";


function Configure(props: { callback: () => void }) {

    const textRef = useRef<HTMLTextAreaElement | null>(null);

    const onApply = () => {
        const config = JSON.parse(textRef.current!.value) as RTCConfiguration;
        setRtcConfig(config)
        props.callback();
    }

    return <Box width={"100%"}>
        <textarea ref={textRef} defaultValue={JSON.stringify(rtcConfig)} style={{width: "100%", height: "300px"}}/>
        <Button onClick={onApply} size={"large"}>应用</Button>
    </Box>
}

function Logger() {
    const [log, setLog] = React.useState<string[]>([])

    useEffect(() => {
        setLogCb(l => {
            setLog([l, ...log]);
        })
    }, [log])

    return < textarea style={{width: "400px", height: "200px", wordBreak: "keep-all"}} defaultValue={log.join("\n")}/>
}

function WebRtcView(props: { targetId: string, incoming: Incoming | null }) {

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const videoTargetRef = useRef<HTMLVideoElement | null>(null);

    const [incoming, setIncoming] = React.useState<Incoming | null>(props.incoming);
    const [dialing, setDialing] = React.useState<Dialing | null>(null);
    const [call, setCall] = React.useState<Dialog | null>(null);

    const [rtcState, setRtcState] = React.useState<WebRtcSessionState>(props.incoming === null ? "idle" : "incoming");

    useEffect(() => {
        videoRef.current!.onloadedmetadata = () => {
            videoRef.current!.play().then(() => {
                console.log("play")
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
        if (props.incoming === null) {
            return;
        }
        props.incoming.peer.onRemoteTrack = (track: RTCTrackEvent) => {
            videoTargetRef.current!.srcObject = track.streams[0];
        }
        props.incoming.onCancel = () => {
            setIncoming(null);
            setRtcState("idle");
        }
    }, [props.incoming])

    const handleDialog = (dialog: Dialog) => {
        dialog.onHangup = () => {
            videoRef.current?.pause()
            videoTargetRef.current?.pause()
            videoRef.current!.srcObject = null;
            videoTargetRef.current!.srcObject = null;
            setRtcState("idle");
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
                }
            )
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
                            alert(msg);
                        }
                        dialing.onReject = () => {
                            setRtcState("idle");
                        }
                        dialing.onAccept = (c: Dialog) => {
                            handleDialog(c);
                        }
                    }).catch((err) => {
                    alert(err);
                });
                break;
            case "dialing":
                dialing?.cancel().then(() => {
                    videoRef.current!.pause();
                    videoRef.current!.srcObject = null;
                    setDialing(null);
                    setRtcState("idle");
                });
                break;
            case "incoming":
                incoming?.accept().then((call) => {
                    handleDialog(call);
                }).catch(e => {
                    setRtcState("idle");
                    alert("error" + e);
                })
                break;
            case "connected":
                call?.hangup().then(() => {
                    setRtcState("idle");
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
        <IconButton onClick={() => props.onClick(false)} size={"large"}>
            {icon}
        </IconButton>
        {props.state === "incoming" ? (<IconButton onClick={() => props.onClick(true)} color={'warning'}>
            <CloseRounded/>
        </IconButton>) : <></>}
    </Box>
}

export default function AppWebRTC() {

    const sid = SessionList.getInstance().getSelectedSession()
    const session = SessionList.getInstance().get(sid)

    const [config, setConfig] = React.useState(false);

    if (session.isGroup()) {
        return <>不支持的会话类型</>
    }

    return <div>
        <WebRtcView targetId={session.To} incoming={WebRTC.incoming}/>
        <Configure callback={() => setConfig(true)}/>
    </div>
}