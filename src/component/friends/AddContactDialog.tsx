import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    TextField,
} from '@mui/material';
import { useState } from 'react';

interface AddContactDialogProp {
    open: boolean;
    onClose: () => void;
    onSubmit: (isGroup: boolean, id: string) => void;
}

export function AddContactDialog(props: AddContactDialogProp) {
    const [id, setId] = useState("")

    return <>
        <Dialog open={props.open} onClose={props.onClose} aria-labelledby="form-dialog-title">
            <DialogTitle id="form-dialog-title">Add Contact</DialogTitle>
            <DialogContent>
                <TextField autoFocus onChange={e => {
                    setId(e.target.value)
                }} margin="dense" id="number" label="ID"
                           type="text"
                           fullWidth/>
            </DialogContent>
            <DialogActions>
                <Button onClick={props.onClose} color="primary">
                    Cancel
                </Button>
                <Button onClick={() => {
                    props.onSubmit(false, id)
                }} color="primary">
                    Add Friend
                </Button>
            </DialogActions>
        </Dialog>
    </>
}
