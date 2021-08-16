import {Avatar, Box, Grid, Typography} from "@material-ui/core";
import {client} from "../im/client";
import {IChatMessage} from "../im/message";


export function ChatMessageComp(props: { msg: IChatMessage, isGroup: boolean }) {

    const sender = client.getCachedUserInfo(props.msg.Sender)
    const me = (sender?.Uid ?? -11) === client.uid
    const avatar = sender?.Avatar ?? ""

    const align: "flex-start" | "flex-end" = me ? "flex-end" : "flex-start"
    const m = <Grid item md={1}><Avatar src={avatar}/></Grid>

    let name = <></>
    if (props.isGroup && !me) {
        name = <Box style={{padding: '0 8px'}}>
            <Typography variant={'caption'} color={'textSecondary'} component={"p"}>
                {sender.Nickname}
            </Typography>
        </Box>
    }

    return <Grid container direction={"row"} alignItems={align}>
        {me ? <div/> : m}
        <Grid item md={11} style={{minHeight: "40px"}}>
            {name}
            <Box bgcolor={"info.main"} style={{
                minHeight: "32px",
                maxWidth: "90%",
                float: me ? "right" : "left",
                marginLeft: me ? "0px" : "8px",
                marginRight: me ? "8px" : "0px",
                wordWrap: "break-word",
                display: "inline-block",
                padding: "6px",
                borderRadius: "6px"
            }}>
                <Typography variant={"body1"} component={'span'}>{`${props.msg.Message}`}</Typography>
            </Box>
        </Grid>
        {me ? m : <div/>}
    </Grid>
}
