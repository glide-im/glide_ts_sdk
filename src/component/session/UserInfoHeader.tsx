import {RouteComponentProps, withRouter} from "react-router-dom";
import {Account} from "../../im/account";
import List from '@mui/material/List';
import Checkbox from '@mui/material/Checkbox';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import React, {forwardRef, useEffect, useImperativeHandle, useRef, useState} from "react";
import {IMWsClient} from "../../im/im_ws_client";
import {
    Avatar,
    Box,
    Button,
    Dialog, DialogActions,
    DialogContent,
    DialogTitle, Drawer,
    IconButton,
    Menu,
    MenuItem,
    TextField
} from "@mui/material";
import LoadingButton from '@mui/lab/LoadingButton';
import {grey} from "@mui/material/colors";
import {
    AddCommentOutlined,
    ChatOutlined,
    ExitToAppOutlined,
    MenuOutlined,
    RefreshOutlined,
    SettingsOutlined,
} from "@mui/icons-material";
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';


export const UserInfoHeader = withRouter((props: RouteComponentProps) => {
    const blackListDrawerRef = useRef<any>()
    let u = Account.getInstance().getUserInfo()
    if (u === null) {
        u = {
            avatar: "-", name: "-", id: "-", isChannel: false
        }
    }
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const [online, setOnline] = useState(IMWsClient.isReady())

    useEffect(() => {

    })

    useEffect(() => {

        const sp = IMWsClient.events().subscribe({
            next: (e) => {
                e.state === WebSocket.OPEN ? setOnline(true) : setOnline(false)
            }
        })
        return () => sp.unsubscribe()
    }, []);

    const onExitClick = () => {
        Account.getInstance().logout()
        props.history.replace("/auth")
    }

    const reconnect = () => {
        Account.getInstance().auth().subscribe()
    }

    return <div className={'flex justify-between items-center p-4'}>
        <div className={'flex items-center'}>
            <Avatar src={u.avatar} sx={{width: 40, height: 40, bgcolor: grey[400]}}/>
            <div className={'text-left flex flex-col ml-5'}>
                <span className={'text-base'}>{u.name}</span>
                <span className={'text-sm'}>UID: {u.id}</span>
            </div>
        </div>

        <div>
            <IconButton size={"large"} onClick={(e) => setAnchorEl(e.currentTarget)}>
                <MenuOutlined fontSize={"medium"}/>
            </IconButton>
            {online ? "" : <IconButton size={"large"} onClick={reconnect}><RefreshOutlined/></IconButton>}

            <CreateSessionDialog open={false} callback={(uid) => {
                if (uid.length > 2) {
                    Account.getInstance().getSessionList().createSession(uid).subscribe()
                }
            }}/>
            <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
            >
                <MenuItem disabled>
                    <SettingsOutlined/><Box m={1}>设置</Box>
                </MenuItem>
                <MenuItem onClick={onExitClick}>
                    <ExitToAppOutlined/><Box m={1}>退出登录</Box>
                </MenuItem>
                <MenuItem onClick={() => blackListDrawerRef.current.show()}>
                    <AdminPanelSettingsIcon/><Box m={1}>黑名单管理</Box>
                </MenuItem>
                <MenuItem disabled>
                    <AddCommentOutlined/><Box m={1}>创建会话</Box>
                </MenuItem>
            </Menu>

            <BlackListDrawer ref={blackListDrawerRef}/>
        </div>
    </div>
})

const BlackListDrawer = forwardRef((props, ref) => {
    const [isShow, setIsShow] = useState<boolean>(false)
    const toggleDrawer = (open: boolean) => (event: React.KeyboardEvent | React.MouseEvent) => {
        setIsShow(open)
    }

    const [checked, setChecked] = React.useState([1]);
    const [permitOperate, setPermitOperate] = useState<boolean>(false);
    const [permitOperateLoading, setPermitOperateLoading] = useState<boolean>(false);

    const handleToggle = (value: number) => () => {
        const currentIndex = checked.indexOf(value);
        const newChecked = [...checked];

        if (currentIndex === -1) {
            newChecked.push(value);
        } else {
            newChecked.splice(currentIndex, 1);
        }

        setChecked(newChecked);
    };

    useImperativeHandle(ref, () => ({
        show: () => {
            setIsShow(true)
        }
    }))

    return <Drawer
        classes={{paper: 'min-w-[500px]'}}
        anchor={'right'}
        open={isShow}
        onClose={toggleDrawer(false)}
    >
        <List dense sx={{width: '100%', bgcolor: 'background.paper'}}
              subheader={<div>
                  <div style={{lineHeight: 0.2}}
                       className={'my-2 mx-5 text-gray-500 text-sm flex justify-between leading-none'}>
                      <p>黑名单管理</p>
                      {
                          !permitOperate ?
                              <Button variant="text" size="small" onClick={() => setPermitOperate(true)}>移出</Button> :
                              <div>
                                  <Button size="small" variant={'text'} onClick={() => {
                                      setPermitOperate(false); setChecked([])
                                  }}>
                                      取消
                                  </Button>
                                  <LoadingButton loading={permitOperateLoading} color={'success'} size="small"
                                                 variant="contained" disabled={checked.length === 0}
                                                 onClick={() => setPermitOperate(true)}>
                                      完成 ({checked.length})
                                  </LoadingButton>
                              </div>
                      }
                  </div>
              </div>}
        >
            {[0, 1, 2, 3].map((value) => {
                const labelId = `checkbox-list-secondary-label-${value}`;
                return (
                    <ListItem
                        key={value}
                        secondaryAction={
                            permitOperate ?
                                <Checkbox
                                    edge="end"
                                    onChange={handleToggle(value)}
                                    checked={checked.indexOf(value) !== -1}
                                    inputProps={{'aria-labelledby': labelId}}
                                /> : <></>
                        }
                        disablePadding
                    >
                        <ListItemButton>
                            <ListItemAvatar>
                                <Avatar
                                    alt={`Avatar n°${value + 1}`}
                                    src={`/static/images/avatar/${value + 1}.jpg`}
                                />
                            </ListItemAvatar>
                            <ListItemText id={labelId} primary={`Line item ${value + 1}`}/>
                        </ListItemButton>
                    </ListItem>
                );
            })}
        </List>
    </Drawer>
});

function CreateSessionDialog(props: { open: boolean, callback: (uid: string) => void }) {

    const input = useRef<HTMLInputElement>()

    return <Box>
        <Dialog fullWidth open={props.open} onClose={() => {
            props.callback('')
        }} aria-labelledby="form-dialog-title">
            <DialogTitle id="form-dialog-title">创建会话</DialogTitle>
            <DialogContent>
                <TextField inputRef={input} autoFocus margin="dense" id="text" label="用户 UID"
                           type="text"
                           fullWidth defaultValue={''}/>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => {
                    props.callback(input.current.value)
                }} color="primary">
                    创建
                </Button>
            </DialogActions>
        </Dialog>
    </Box>
}
