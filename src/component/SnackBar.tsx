import { useEffect, useState } from "react";
import { Snackbar } from "@mui/material";

let snack = (s: string) => {
    console.log("show snack:", s);
}

export function showSnack(msg: string) {
    snack(msg);
}

export function SnackBar() {

    const [showSnack, setShowSnack] = useState(false)
    const [snackMsg, setSnackMsg] = useState("")

    useEffect(() => {
        snack = (s: string) => {
            setSnackMsg(s)
            setShowSnack(true)
        }
    }, [])

    return <>
        <Snackbar open={showSnack} autoHideDuration={3000} onClose={() => {
            setShowSnack(false)
        }} message={snackMsg} />
    </>
}
