import {Box, Divider, Grid, IconButton, Typography} from "@mui/material";
import React from "react";
import {useParams} from "react-router-dom";
import {ChatRoomContainer} from "./ChatRoom";
import {SessionListView} from "./SessionListView";
import {AddBox} from "@mui/icons-material";
import {Account} from "../../im/account";

export function Chat() {

    const {to} = useParams<{ to: string }>();
    const handleAddClick = function () {
        Account.getInstance().getSessionList().startChat("543855").then(r => {
        });
    }

    return <Box style={{height: "100%"}}>
        <Grid alignItems={"center"} container style={{height: "100%"}}>

            <Grid item xs={4} style={{height: "100%"}}>
                <Box m={2}>
                    <Typography variant={"caption"}>Messages</Typography>
                    <IconButton onClick={handleAddClick} size={"small"} style={{float: "right"}}>
                        <AddBox/>
                    </IconButton>
                </Box>
                <Divider/>
                <Box overflow={"hidden"} height={"90%"} className="BeautyScrollBar">
                    <SessionListView selected={to} onSelect={(to: string) => {

                    }}/>
                </Box>
            </Grid>


            <Grid item xs={8} style={{height: "100%"}}>
                <Divider orientation={"vertical"} style={{float: "left"}}/>
                <ChatRoomContainer to={to}/>
            </Grid>
        </Grid>

    </Box>
}
