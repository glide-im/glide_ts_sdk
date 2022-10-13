import {Avatar, Box, Button, Divider, Grid, Typography} from "@mui/material";
import React, {useEffect, useState} from "react";
import {useParams} from "react-router-dom";
import {ChatRoomContainer} from "./ChatRoom";
import {SessionListView} from "./SessionListView";
import {Account} from "../../im/account";
import {State, Ws} from "../../im/ws";

export function Chat() {

    const {sid} = useParams<{ sid: string }>();

    return <Box style={{height: "100%"}}>
        <Grid alignItems={"center"} container style={{height: "100%"}}>

            <Grid item xs={4} style={{height: "100%"}}>
                <Box height={"20%"}>
                    <UserInfoComp/>
                    <Divider/>
                </Box>
                <Box overflow={"hidden"} height={"80%"} className="BeautyScrollBar">
                    <SessionListView selected={sid} onSelect={null}/>
                </Box>
            </Grid>

            <Grid item xs={8} style={{height: "100%"}}>
                <Divider orientation={"vertical"} style={{float: "left"}}/>
                <ChatRoomContainer sid={sid}/>
            </Grid>
        </Grid>

    </Box>
}


function UserInfoComp() {

    let u = Account.getInstance().getUserInfo()
    if (u === null) {
        u = {
            avatar: "-", name: "-", uid: "-"
        }
    }

    const [online, setOnline] = useState(Ws.isConnected())

    useEffect(() => {
        const l = (s: State, _: any) => {
            if (s === State.CLOSED) {
                setOnline(false)
            } else if (s === State.CONNECTED) {
                setOnline(true)
            }
        }
        Ws.addStateListener(l)
        return () => {
            Ws.removeStateListener(l)
        }
    }, []);

    return <Box>
        <Grid container justifyContent={"center"}>
            <Box mt={2}><Avatar src={u.avatar}/></Box>
        </Grid>
        <Box width={"100%"}>
            <Typography variant={"body2"} textAlign={"center"}>{u.name}</Typography>
            <Typography variant={"body2"} textAlign={"center"}>uid: {u.uid}</Typography>
        </Box>
        <Box justifyContent={'end'}>
            <Button size={'small'}>
                退出登录
            </Button>
            {online ? <></> :
                <Button size={'small'} color={'warning'}>
                    重新连接
                </Button>
            }
        </Box>
    </Box>
}