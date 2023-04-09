import {useEffect, useState} from "react";
import {enqueueSnackbar, SnackbarProvider} from 'notistack';

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
            // setSnackMsg(s)
            // setShowSnack(true)
            enqueueSnackbar(s, {variant: "info"})
        }
        return () => {
            snack = (s: string) => {
                console.log("show snack:", s);
            }
        }
    }, [])

    return <SnackbarProvider maxSnack={3}><span/></SnackbarProvider>

}
