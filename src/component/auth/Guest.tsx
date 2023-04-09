import {GitHub, Settings} from "@mui/icons-material";
import {Avatar, Box, Button, Grid, Hidden, IconButton, Paper, TextField} from "@mui/material";
import {useRef, useState} from "react";
import {RouteComponentProps, withRouter} from "react-router-dom";
import {Account} from "../../im/account";
import {SettingDialog} from "./SettingsDialog";


export const Guest = withRouter((props: RouteComponentProps) => {

    const accountInput = useRef<HTMLInputElement>(null)

    const [open, setOpen] = useState(false)
    const onSubmit = () => {
        let n = accountInput.current.value
        if (n === '') {
            n = generateWuxiaName()
        }

        Account.getInstance().guest(n, `https://api.dicebear.com/6.x/adventurer/svg?seed=${n}`).subscribe({
            error: (e) => {
                alert(e)
            },
            complete: () => {
                props.history.push('/im')
            }
        })
    }
    const onSettingClick = () => {
        setOpen(true)
    }
    const onGithubClick = () => {
        window.open("https://github.com/glide-im/glide_ts_sdk")
    }
    return (
        <>
            <SettingDialog show={open} onClose={() => {
                setOpen(false)
            }}/>
            <Box style={{position: "absolute", display: "block", top: "10px", right: "10px"}}>
                <IconButton onClick={onSettingClick}>
                    <Settings/>
                </IconButton>
                <IconButton onClick={onGithubClick}>
                    <GitHub/>
                </IconButton>
            </Box>
            <Hidden mdDown>
                <Grid container justifyContent={"center"}>
                    <Paper variant={"outlined"}>
                        <Grid container sx={{p: 2}} p={2}>
                            <Grid item xs={12}>
                                <Grid item justifyContent={"center"} xs={12} display={"flex"}>
                                    <Avatar src={'./logo.png'} sx={{width: 50, height: 50}}/>
                                </Grid>

                                <Grid item justifyContent={"center"} xs={12} mt={4}>
                                    <TextField inputRef={accountInput} autoFocus margin="dense" id="account"
                                               label="输入昵称 (不填随机)"
                                               type="text"
                                               fullWidth/>
                                </Grid>
                            </Grid>
                            <Grid container mt={4} mb={2}>
                                <Grid xs={8} item>
                                    <Button onClick={() => props.history.push('/auth/signup')}
                                            disabled={true}>注册账号</Button>
                                </Grid>
                                <Grid xs={4} justifyContent={"right"} display={"flex"} item>
                                    <Button variant="contained" color="primary" onClick={onSubmit}>游客登录</Button>
                                </Grid>
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>
            </Hidden>
            <Hidden mdUp>
                <Grid container spacing={2} p={2} bgcolor={'white'}>
                    <Grid item xs={12}>
                        <Grid item justifyContent={"center"} xs={12} display={"flex"}>
                            <Avatar src={'./logo.png'} sx={{width: 50, height: 50}}/>
                        </Grid>

                        <Grid item justifyContent={"center"} xs={12} mt={4}>
                            <TextField inputRef={accountInput} autoFocus margin="dense" id="account"
                                       label="输入昵称 (不填随机)"
                                       type="text"
                                       fullWidth/>
                        </Grid>
                    </Grid>
                    <Grid item xs={12}>
                        <Grid xs={12} item>
                            <Button fullWidth variant="contained" onClick={onSubmit} size={"large"}>游客登录</Button>
                        </Grid>
                        <Grid xs={4} mt={2} item>
                            <Button onClick={() => props.history.push('/auth/signup')}
                                    disabled={true}>注册账号</Button>
                        </Grid>
                    </Grid>
                </Grid>
            </Hidden>
        </>
    )
})

const surnames: string[] = ["张", "李", "赵", "钱", "孙", "周", "吴", "郑", "王", "冯", "陈", "褚", "卫", "沈", "韩", "杨", "朱", "秦", "尤", "许", "何", "吕", "施", "桂", "袁", "夏", "殷", "崔", "侯", "邓", "龚", "苏", "梁", "魏", "忻", "唐", "董", "于", "祝", "鲁", "薛", "雷", "贺", "倪", "汤", "滕", "殳", "牛"];
const names: string[] = ["衣", "燕", "心", "天", "罡", "马", "刀", "影", "漠", "魂", "剑", "飞", "云", "雪", "岳", "华", "青", "枫", "波", "霜", "明", "良", "俊", "忠", "信", "义", "勇", "虎", "龙", "豹", "猛", "辉", "杰", "晨", "昊", "博", "翔", "萧", "瑾", "琦", "雯", "婧", "嘉", "慧", "思", "娜", "欣", "峰", "升", "强", "川", "群", "爽"];


function generateWuxiaName(): string {
    let name: string;

    const randomSurname = surnames[Math.floor(Math.random() * surnames.length)];
    const randomName = names[Math.floor(Math.random() * names.length)];

    name = `${randomSurname}${randomName}`;


    return name;
}