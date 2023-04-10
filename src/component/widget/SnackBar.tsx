import {useEffect, useState} from "react";
import {closeSnackbar, enqueueSnackbar, SnackbarProvider} from 'notistack';
import {Button} from "@mui/material";

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
            const action = snackbarId => (
                <Button variant="contained" onClick={() => {
                    closeSnackbar(snackbarId)
                }}>
                    Close
                </Button>
            );
            enqueueSnackbar(s, {variant: "info", autoHideDuration: 3000, action: action})
        }
        return () => {
            snack = (s: string) => {
                console.log("show snack:", s);
            }
        }
    }, [])

    return <SnackbarProvider maxSnack={3}><span/></SnackbarProvider>

}
