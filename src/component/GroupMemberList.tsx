import {
    Avatar,
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    TextField
} from "@mui/material";
import {Add} from "@mui/icons-material";
import {useEffect, useState} from "react";
import {client} from "../im/client";
import {Session} from "../im/session";


export function GroupMemberList(props: { session: Session }) {

    const [showAddMember, setShowAddMember] = useState(false)
    const [, update] = useState(1)

    useEffect(() => {


    }, [props])

    // TODO
    return <></>

    const style = {margin: '4px 1px', display: 'inline-block', justifyContent: 'center'}
    const avatars = []
        .map(value => {
                const u = client.getCachedUserInfo(value.Uid)
                return <li style={style} key={value.Uid}>
                    <Avatar src={u?.Avatar ?? ""} alt={u?.Nickname ?? ""}
                            style={{height: '30px', width: '30px', border: '1px solid gray'}}/>
                </li>
            }
        )

    const onAddMemberClick = () => {
        setShowAddMember(true)
    }
    const addMember = (id: number) => {
        if (id > 0) {
            // group.inviteToGroup(group.Gid, [id]).then()
        }
        setShowAddMember(false)
    }

    return (
        <Box style={{height: "40px", width: '100%', background: "white"}}>
            <AddMemberDialog callback={addMember} open={showAddMember}/>
            <ul style={{
                listStyle: 'none',
                height: '40px',
                padding: '0',
                margin: '0 6px',
                width: 'auto',
                overflowY: 'hidden',
                overflowX: 'auto',
                whiteSpace: 'nowrap'
            }}
                className={"BeautyScrollBarHor"}>
                {avatars}
                <li style={style}>
                    <Avatar style={{height: '30px', width: '30px', cursor: 'pointer'}} onClick={onAddMemberClick}>
                        <Add/>
                    </Avatar>
                </li>
            </ul>
        </Box>
    )
}

function AddMemberDialog(props: { open: boolean, callback: (s: number) => void }) {

    const [id, setId] = useState(-1)

    return <>
        <Dialog open={props.open} onClose={() => {
            props.callback(-1)
        }} aria-labelledby="form-dialog-title">
            <DialogTitle id="form-dialog-title">Add Member</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Invite member to group
                </DialogContentText>
                <TextField autoFocus onChange={e => {
                    const id = parseInt(e.target.value)
                    if (isNaN(id)) {
                        return
                    }
                    setId(id)
                }} margin="dense" id="number" label="ID"
                           type="text"
                           fullWidth/>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => {
                    props.callback(id)
                }} color="primary">
                    Submit
                </Button>
            </DialogActions>
        </Dialog>
    </>
}
