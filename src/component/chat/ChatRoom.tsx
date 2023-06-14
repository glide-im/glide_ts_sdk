import {
    AppBar,
    Box,
    IconButton,
    Menu,
    MenuItem,
    Toolbar,
    Typography,
} from '@mui/material';
import React, { useEffect, useRef } from 'react';
import { Account } from '../../im/account';
import { SessionMessageList } from './MessageList';
import { showSnack } from '../widget/SnackBar';
import { MessageInput, MessageInputV2 } from './MessageInput';
import {
    ArrowBack,
    DeleteOutlined,
    DescriptionOutlined,
    ExitToAppOutlined,
    MoreVertRounded,
    NotificationsOffOutlined,
    PersonAddOutlined,
} from '@mui/icons-material';
import { Loading } from '../widget/Loading';
import { RouteComponentProps, useParams, withRouter } from 'react-router-dom';
import { SessionListEventType } from '../../im/session_list';
import {
    catchError,
    filter,
    map,
    mergeMap,
    Observable,
    of,
    onErrorResumeNext,
    timeout,
} from 'rxjs';
import { Session, SessionType } from '../../im/session';
import { OnlineStatus } from '../widget/OnlineStatus';
import AddBlackList from './components/AddBlackList';

function typingEvent(session: Session): Observable<boolean> {
    return onErrorResumeNext(
        session.inputEvent.pipe(
            map((v) => true),
            timeout(1500),
            catchError((e) => of(false))
        ),
        of(false).pipe(mergeMap((v) => typingEvent(session)))
    );
}

function SessionTitleBar(props: { session: Session }) {

    const [isBlackList, setIsBlackList] = React.useState(false)
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const [typing, setTyping] = React.useState(false);
    const relativeList = Account.getInstance().getRelativeList();
    const channel = props.session.Type === SessionType.Channel

    const handleCleanMessage = () => {
        props.session.clearMessageHistory().subscribe({
            next: (v) => {
                showSnack("消息已清理")
            },
            error: (e) => {
                showSnack("清理消息失败")
            }
        })
        setAnchorEl(null);
    }

    useEffect(() => {
        const subscribe = typingEvent(props.session).subscribe({
            next: (v) => {
                setTyping(v)
            }
        });
        props.session.event.pipe()
        return () => subscribe.unsubscribe()
    }, [props.session])

    const handleExit = () => {
        setAnchorEl(null);
    }

    const handleMute = () => {
        setAnchorEl(null);
    }

    const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    return <>
        <AppBar position="static" color={'transparent'} style={{boxShadow: 'none'}}>
            <Toolbar>
                <Box sx={{flexGrow: 1}}>
                    <Typography variant="h6" component={'span'}>
                        {props.session?.Title ?? "-"}

                        {
                            isBlackList ?
                                <span className={'text-sm text-gray-400 mx-2'}>已拉黑</span>
                                : <></>
                        }
                    </Typography>
                    <OnlineStatus sid={props.session.ID}/>
                    {
                        typing ? <Typography variant="caption" color={'grey'} ml={2}>
                            输入中...
                        </Typography> : <></>
                    }
                </Box>
                <IconButton edge={'end'} size="large"
                            aria-label="account of current user"
                            aria-controls="menu-appbar"
                            aria-haspopup="true"
                            onClick={handleMenu}
                            color="inherit">
                    <MoreVertRounded/>
                </IconButton>

                <Menu
                    id="menu-appbar"
                    anchorEl={anchorEl}
                    anchorOrigin={{
                        vertical: 'top',
                        horizontal: 'right',
                    }}
                    keepMounted
                    transformOrigin={{
                        vertical: 'top',
                        horizontal: 'right',
                    }}
                    open={Boolean(anchorEl)}
                    onClose={handleClose}
                >
                    {!channel ? "" :
                        <MenuItem disabled>
                            <DescriptionOutlined/><Box m={1}>频道详细信息</Box>
                        </MenuItem>
                    }
                    {channel ? "" :
                        <MenuItem>
                            <PersonAddOutlined/><Box m={1}>添加好友</Box>
                        </MenuItem>
                    }
                    {channel ? "" :
                        <AddBlackList updateIsBlackList={(v: boolean) => setIsBlackList(v)}
                                      relativeList={relativeList}
                                      uid={props.session.To}/>
                    }
                    <MenuItem onClick={handleCleanMessage}>
                        <DeleteOutlined/><Box m={1}>清理消息</Box>
                    </MenuItem>
                    {!channel ? "" :
                        <MenuItem disabled onClick={handleMute}>
                            <NotificationsOffOutlined/><Box m={1}>关闭通知</Box>
                        </MenuItem>
                    }
                    {!channel ? "" :
                        <MenuItem disabled onClick={handleExit}>
                            <ExitToAppOutlined/><Box m={1}>退出频道</Box>
                        </MenuItem>
                    }
                </Menu>
            </Toolbar>
        </AppBar>
    </>
}

export function ChatRoomContainer() {

    const {sid} = useParams<{ sid: string }>();
    const [session, setSession] = React.useState(null);

    const input = useRef<HTMLElement>(null);

    const [inputHeight, setInputHeight] = React.useState(64);

    useEffect(() => {
        if (input.current === null) {
            return
        }
        setInputHeight(input.current.clientHeight)
    }, [])

    useEffect(() => {
        setSession(Account.session().get(sid))
    }, [sid])

    useEffect(() => {
        if (session === null) {
            const sp = Account.session().event().pipe(
                filter((e) => e.event === SessionListEventType.create && e.session.ID === sid),
                map((e) => e.session)
            ).subscribe((e) => setSession(e))
            return () => sp.unsubscribe()
        }
    }, [session, sid])

    if (session === null) {
        return <Box className={'rounded-br-md rounded-tr-md'}>
            <Typography variant="h6" textAlign={"center"} mt={'40%'}>
                选择一个会话开始聊天
            </Typography>
        </Box>
    }

    const onInputChange = () => {
        if (input.current === null) {
            return
        }
        setInputHeight(input.current.clientHeight)
    }

    return (
        <Box className={'h-full max-h-full flex flex-col rounded-br-md rounded-tr-md'}
             style={{
                 backgroundImage: `url(https://im.dengzii.com/chat_bg.jpg)`,
                 backgroundRepeat: 'repeat',
             }}>
            <Box className={'flex-none grow-0 w-full rounded-tr-md'} color={'black'} bgcolor={"white"}>
                <SessionTitleBar session={session}/>
            </Box>
            <Box className={'w-full flex-1 flex-shrink'} height={`calc(100% - 64px - ${inputHeight}px)`}>
                <SessionMessageList/>
            </Box>
            <Box className={'flex-none grow-0 mx-4 pb-4 pt-1'} ref={input}>
                <MessageInputV2 sid={sid} onLayoutChange={onInputChange}/>
            </Box>
        </Box>)
}

export const ChatRoomContainerMobile: any = withRouter((props: RouteComponentProps) => {

    const {sid} = useParams<{ sid: string }>();
    const session = Account.getInstance().getSessionList().get(sid);

    if (session === null) {
        props.history.replace("/im/session")
        return <Loading/>
    }

    const sendMessage = (msg: string, type: number) => {
        if (session != null) {
            session.send(msg, type).subscribe({error: (err) => showSnack(err.toString())})
        }
    }

    return (<Box height={"100vh"}>
        <AppBar position="static">
            <Toolbar>
                <IconButton edge="start" color="inherit" aria-label="menu" onClick={() => {
                    session.clearUnread()
                    props.history.replace("/im/session")
                }}>
                    <ArrowBack/>
                </IconButton>
                <Typography variant="h6">
                    {session?.Title ?? "-"}
                </Typography>
            </Toolbar>
        </AppBar>

        <Box height={"calc(100vh - 138px)"} style={{
            backgroundImage: `url(/chat_bg.jpg)`,
            backgroundRepeat: 'repeat',
        }} width={'100%'}>
            {/*<Box height={"10%"}>*/}
            {/*    {isGroup && (<Box><GroupMemberList id={session.To}/><Divider/></Box>)}*/}
            {/*</Box>*/}

            <div className={'flex flex-col h-full'}>
                <Box height={"calc(95vh - 60px)"}
                     className={'BeautyScrollBar overflow-y-auto flex w-full'}>
                    <SessionMessageList/>
                </Box>
            </div>
        </Box>
        <Box height={'80px'} bgcolor={"white"}>
            <MessageInput onSend={sendMessage}/>
        </Box>
    </Box>)
})