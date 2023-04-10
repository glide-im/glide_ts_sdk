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
import {Account} from "../../im/account";
import { isEnableCookie, setCookie, setEnableCookie } from "../../utils/Cookies";
import { Api } from "../../api/api";

export function SettingDialog(props: { show: boolean, onClose: () => void }) {

    const baseUrl = useRef<HTMLInputElement>(null)
    const wsUrl = useRef<HTMLInputElement>(null)
    const ackNotify = useRef<HTMLInputElement>(null)
    const enableCache = useRef<HTMLInputElement>(null)

    const url = Api.getBaseUrl()
    const ws = Account.getInstance().server
    const enableCookie = isEnableCookie()

    const onApply = () => {
        const u = baseUrl.current.value
        const w = wsUrl.current.value
        Api.setBaseUrl(u)
        Account.getInstance().server = w
        setCookie("baseUrl", u, 100)
        setCookie('wsUrl', w, 100)
        setEnableCookie(enableCache.current.checked)
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
                <FormControlLabel disabled control={<Switch inputRef={ackNotify}/>} label="启用接收者确认收到"/>
                <FormControlLabel control={<Switch  defaultChecked={enableCookie} inputRef={enableCache}/>}
                                  label="启用 Cookie"/>
            </DialogContent>
            <DialogActions>
                <Button onClick={props.onClose} color="primary">取消</Button>
                <Button onClick={onApply} color="primary">应用</Button>
            </DialogActions>
        </Dialog>
    </>
}
