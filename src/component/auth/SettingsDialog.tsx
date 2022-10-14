import {
    Button,
    Dialog,
    DialogActions,
    DialogContent, DialogTitle,
    FormControlLabel,
    Switch,
    TextField
} from "@mui/material";
import {useRef} from "react";
import {Api} from "src/api/api";
import {setCookie} from "src/utils/Cookies";
import {Account} from "../../im/account";

export function SettingDialog(props: { show: boolean, onClose: () => void }) {

    const baseUrl = useRef<HTMLInputElement>(null)
    const wsUrl = useRef<HTMLInputElement>(null)
    const ackNotify = useRef<any>(null)

    const url = Api.getBaseUrl()
    const ws = Account.getInstance().server

    const onApply = () => {
        const u = baseUrl.current.value
        const w = wsUrl.current.value
        Api.setBaseUrl(u)
        Account.getInstance().server = w
        setCookie("baseUrl", u, 100)
        setCookie('wsUrl', w, 100)
        props.onClose()
    }

    return <>
        <Dialog open={props.show} aria-labelledby="form-dialog-title">
            <DialogTitle id="form-dialog-title">应用设置</DialogTitle>
            <DialogContent>
                <TextField inputRef={baseUrl} autoFocus margin="dense" id="baseUrl" label="HTTP API Base Url"
                           type="url" fullWidth defaultValue={url}/>
                <TextField inputRef={wsUrl} autoFocus margin="dense" id="baseUrl" label="IM WebSocket Server Url"
                           type="url"
                           fullWidth defaultValue={ws}/>
                <FormControlLabel disabled control={<Switch ref={ackNotify}/>} label="启用接收者确认收到"/>
            </DialogContent>
            <DialogActions>
                <Button onClick={props.onClose} color="primary">取消</Button>
                <Button onClick={onApply} color="primary">应用</Button>
            </DialogActions>
        </Dialog>
    </>
}
