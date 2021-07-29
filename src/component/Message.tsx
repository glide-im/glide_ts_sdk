import {Avatar, Box, Grid, Typography} from "@material-ui/core";
import {client} from "../im/client";
import {IChatMessage} from "../im/message";

export function ChatMessageComp(v: { msg: IChatMessage }) {

    const me = v.msg.SenderUid === client.getMyUid()
    const align: "flex-start" | "flex-end" = me ? "flex-end" : "flex-start"
    const m = <Grid item md={1}><Avatar/></Grid>

    return <Grid container direction={"row"} alignItems={align}>
        {me ? <div/> : m}
        <Grid item md={11} style={{minHeight: "40px"}}>
            <Box bgcolor={"info.main"} style={{
                minHeight: "32px",
                maxWidth: "90%",
                float: me ? "right" : "left",
                marginLeft: me ? "0px" : "8px",
                marginRight: me ? "8px" : "0px",
                wordWrap: "break-word",
                display: "inline-block",
                padding: "6px",
                borderRadius:"6px"
            }}>
                <Typography variant={"body1"} component={'span'}>{`${v.msg.Message}`}</Typography>
            </Box>
        </Grid>
        {me ? m : <div/>}
    </Grid>
}
