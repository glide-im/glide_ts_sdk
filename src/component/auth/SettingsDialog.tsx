import {
    Button,
    Dialog,
    DialogActions,
    DialogContent, DialogTitle,
    FormControlLabel,
    Switch,
    TextField
} from "@mui/material";
import { useRef } from "react";
import { Api } from "src/api/api";
import { setCookie } from "src/utils/Cookies";

export function SettingDialog(props: { show: boolean, onClose: () => void }) {

    const baseUrl = useRef<HTMLInputElement>(null)
    const ackNotify = useRef<any>(null)

    const url = Api.getBaseUrl()

    const onApply = () => {
        const u = baseUrl.current.value
        Api.setBaseUrl(u)
        setCookie("baseUrl", u, 100)
        props.onClose()
    }

    return <>
        <Dialog open={props.show} aria-labelledby="form-dialog-title">
            <DialogTitle id="form-dialog-title">Settings</DialogTitle>
            <DialogContent>
                <TextField inputRef={baseUrl} autoFocus margin="dense" id="baseUrl" label="BaseUrl" type="text" fullWidth defaultValue={url} />
                <FormControlLabel disabled control={<Switch ref={ackNotify} />} label="启用接收者确认收到" />
            </DialogContent>
            <DialogActions>
                <Button onClick={props.onClose} color="primary">Cancel</Button>
                <Button onClick={onApply} color="primary">Apply</Button>
            </DialogActions>
        </Dialog>
    </>
}
