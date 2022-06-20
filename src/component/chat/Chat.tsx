import { Grid3x3Sharp, Refresh } from "@mui/icons-material";
import {
    Avatar,
    Box, Divider,
    Grid,
    IconButton,
    Typography
} from "@mui/material";
import React from "react";
import { useParams } from "react-router-dom";
import { ChatRoomContainer } from "./ChatRoom";
import { SessionListView } from "./SessionListView";


export function Chat() {

    const { to } = useParams<{ to: string }>();

    return <Box style={{ height: "100%" }}>
        <Grid alignItems={"center"} container style={{ height: "100%" }}>

            <Grid item xs={4} style={{ height: "100%" }}>
                <Box height={"10%"} >
                    <Grid container>
                        <Grid item xs={1} justifyItems={"center"}>
                            <Avatar src={"https://i.pravatar.cc/300"} />
                        </Grid>
                    </Grid>
                </Box>
                <Box overflow={"hidden"} height={"90%"} className="BeautyScrollBar">
                    <SessionListView selected={to} onSelect={(to: string) => {

                    }} />
                </Box>
            </Grid>


            <Grid item xs={8} style={{ height: "100%" }}>
                <Divider orientation={"vertical"} style={{ float: "left" }} />
                <ChatRoomContainer to={to} />
            </Grid>
        </Grid>

    </Box>
}
