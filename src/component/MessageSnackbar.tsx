// import {SnackbarProvider, useSnackbar, VariantType} from "notistack";
import {client, MessageLevel} from "../im/client";

// const vt = new Map<MessageLevel, VariantType>([
//     [MessageLevel.LevelDefault, 'default'],
//     [MessageLevel.LevelInfo, 'info'],
//     [MessageLevel.LevelError, 'error'],
//     [MessageLevel.LevelSuccess, 'success'],
//     [MessageLevel.LevelWarning, 'warning']
// ])

function Notistask() {
    // const {enqueueSnackbar} = useSnackbar();
    //
    // client.messageListener = (level, msg) => {
    //     let t: VariantType = vt.get(level)
    //     enqueueSnackbar(msg, {variant: t})
    // }

    return <></>
}

export default function MessageStack() {

    return (
        <></>
        // <SnackbarProvider maxSnack={6}>
        //     <Notistask/>
        // </SnackbarProvider>
    )
}
