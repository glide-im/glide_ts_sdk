import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    TextField
} from "@material-ui/core";
import {useState} from "react";


interface AddContactDialogProp {
    open: boolean,
    onClose: () => void,
    onSubmit: (isGroup: boolean, id: number) => void,
}

export function AddContactDialog(props: AddContactDialogProp) {
    const [id, setId] = useState(-1)

    return <>
        <Dialog open={props.open} onClose={props.onClose} aria-labelledby="form-dialog-title">
            <DialogTitle id="form-dialog-title">Add Contact</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Group or friend ID
                </DialogContentText>
                <TextField autoFocus onChange={e => {
                    setId(parseInt(e.target.value))
                }} margin="dense" id="number" label="ID"
                           type="text"
                           fullWidth/>
            </DialogContent>
            <DialogActions>
                <Button onClick={props.onClose} color="primary">
                    Cancel
                </Button>
                <Button onClick={() => {
                    props.onSubmit(true, id)
                }} color="primary">
                    Add Group
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
