import {useState} from "react";
import {Snackbar} from "@mui/material";

export function SnackBar() {

    const [showSnack, setShowSnack] = useState(false)
    // const [snackMsg, setSnackMsg] = useState("")

    // client.setToaster((toast: string) => {
    //     setSnackMsg(toast)
    //     setShowSnack(true)
    // })

    return <>
        <Snackbar open={showSnack} autoHideDuration={3000} onClose={() => {
            setShowSnack(false)
        }} message={""}/>
    </>
}
