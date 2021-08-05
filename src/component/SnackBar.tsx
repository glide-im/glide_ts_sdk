import {useState} from "react";
import {client} from "../im/client";
import {Snackbar} from "@material-ui/core";

export function SnackBar() {

    const [showSnack, setShowSnack] = useState(false)
    const [snackMsg, setSnackMsg] = useState("")

    client.setToaster((toast: string) => {
        setSnackMsg(toast)
        setShowSnack(true)
    })

    return <>
        <Snackbar open={showSnack} autoHideDuration={3000} onClose={() => {
            setShowSnack(false)
        }} message={snackMsg}/>
    </>
}
