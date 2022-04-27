import {
    Box, Divider,
    Grid
} from "@mui/material";
import React from "react";
import { useParams } from "react-router-dom";
import { ChatRoomContainer } from "./ChatRoom";
import { SessionListView } from "./SessionListView";


export function Chat() {

    const { to } = useParams<{ to: string }>();
    console.log("Chat", to)

    return <Box style={{ height: "700px" }}>
        <Grid alignItems={"center"} container style={{}}>
            <Grid item xs={4} style={{ height: "700px" }}>
                <SessionListView selected={to} onSelect={(to: number) => {

                }} />
            </Grid>
            <Grid item xs={8} style={{ height: "700px" }}>
                <Divider orientation={"vertical"} style={{ float: "left" }} />
                <ChatRoomContainer to={to} />
            </Grid>
        </Grid>

    </Box>
}
