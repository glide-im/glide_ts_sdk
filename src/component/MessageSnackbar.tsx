import {SnackbarProvider, useSnackbar, VariantType} from "notistack";
import {client} from "../im/client";

function Notistask() {
    const {enqueueSnackbar} = useSnackbar();

    client.messageListener = (m) => {
        const data = m.Data
        let t: VariantType = 'success'
        enqueueSnackbar(`${m.Action} => ${data}`, {variant: t})
    }

    return <></>
}

export default function MessageStack() {

    return (
        <SnackbarProvider maxSnack={6}>
            <Notistask/>
        </SnackbarProvider>
    )
}
