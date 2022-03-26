import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    TextField
} from "@mui/material";
import {useRef, useState} from "react";


interface LoginDialogProp {
    open: boolean,
    onClose: () => void,
    onSubmit: (register: boolean, form: { account: string, password: string }) => void
}

export function MyDialog(props: LoginDialogProp) {

    const account = useRef<HTMLInputElement>(null)
    const password = useRef<HTMLInputElement>(null)
    const [form, setForm] = useState({account: "", password: ""})

    return <>
        <Dialog open={props.open} onClose={props.onClose} aria-labelledby="form-dialog-title">
            <DialogTitle id="form-dialog-title">Login/Register</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Login or register
                </DialogContentText>
                <TextField ref={account} autoFocus onChange={e => {
                    form.account = e.target.value
                    setForm(form)
                }} margin="dense" id="account" label="Account"
                           type="text" fullWidth/>
                <TextField ref={password} onChange={e => {
                    form.password = e.target.value
                    setForm(form)
                }} margin="dense" id="password" label="Password"
                           type="text"
                           fullWidth/>
            </DialogContent>
            <DialogActions>
                <Button onClick={props.onClose} color="primary">
                    Cancel
                </Button>
                <Button onClick={() => {
                    props.onSubmit(true, form)
                }} color="primary">
                    Sign In
                </Button>
                <Button onClick={() => {
                    props.onSubmit(false, form)
                }} color="primary">
                    Sign Up
                </Button>
            </DialogActions>
        </Dialog>
    </>
}
