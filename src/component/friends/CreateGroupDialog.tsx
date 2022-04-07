import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    TextField
} from "@mui/material";
import {useState} from "react";


interface CreateGroupDialogProp {
    open: boolean,
    onClose: () => void,
    onSubmit: (name: string) => void,
}

export function CreateGroupDialog(props: CreateGroupDialogProp) {
    const [name, setName] = useState("")

    return <>
        <Dialog open={props.open} onClose={props.onClose} aria-labelledby="form-dialog-title">
            <DialogTitle id="form-dialog-title">Create Group Chat</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Group Name
                </DialogContentText>
                <TextField autoFocus onChange={e => {
                    setName(e.target.value)
                }} margin="dense" id="text" label="ID"
                           type="text"
                           fullWidth/>
            </DialogContent>
            <DialogActions>
                <Button onClick={props.onClose} color="primary">
                    Cancel
                </Button>
                <Button onClick={() => {
                    props.onSubmit(name)
                }} color="primary">
                    Submit
                </Button>
            </DialogActions>
        </Dialog>
    </>
}
