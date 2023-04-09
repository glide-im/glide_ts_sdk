import {Box, Divider, Grid} from "@mui/material";
import React from "react";
import {useParams} from "react-router-dom";
import {ChatRoomContainer} from "../chat/ChatRoom";
import {SessionListView} from "./SessionListView";
import {UserInfoHeader} from "./UserInfoHeader";

export function Chat() {

    const {sid} = useParams<{ sid: string }>();

    return <Box style={{height: "100%"}}>
        <Grid alignItems={"center"} container style={{height: "100%"}}>

            <Grid item xs={3} style={{height: "100%"}}>
                <Box>
                    <UserInfoHeader/>
                </Box>
                <Divider/>
                <Box overflow={"hidden"} className="BeautyScrollBar">
                    <SessionListView selected={sid} onSelect={null}/>
                </Box>
            </Grid>

            <Grid item xs={9} style={{height: "100%"}}>
                <Divider orientation={"vertical"} style={{float: "left"}}/>
                <ChatRoomContainer sid={sid}/>
            </Grid>
        </Grid>

    </Box>
}

