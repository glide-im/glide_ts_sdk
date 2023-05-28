import {
    AppBar,
    BottomNavigation,
    BottomNavigationAction,
    Box,
    Divider,
    Grid,
    Hidden,
    IconButton,
    Toolbar,
    Typography
} from "@mui/material";
import {grey} from "@mui/material/colors";
import React from "react";
import {Redirect, Route, RouteComponentProps, Switch, useRouteMatch, withRouter} from "react-router-dom";
import {Account} from "../im/account";
import {ContactsList} from "./friends/ContactsList";
import {Square} from "./square/Square";
import {SessionListView} from "./session/SessionListView";
import {ManageAccountsOutlined, MessageOutlined} from "@mui/icons-material";
import {ChatRoomContainer, ChatRoomContainerMobile} from "./chat/ChatRoom";
import {Profile} from "./Profile";
import {UserInfoHeader} from "./session/UserInfoHeader";
import VideoChat from "./webrtc/VideoChatDialog";


export const AppMainPanel = withRouter((props: RouteComponentProps) => {

    if (!Account.getInstance().isAuthenticated()) {
        props.history.push("/auth");
        return <></>
    }

    const match = useRouteMatch();

    return (
        <div className={'h-full 2xl:h-5/6 2xl:w-8/12 w-full 2xl:mx-auto mx-0 rounded-md bg-white '}>
            <VideoChat session={''} showIcon={false}/>
            <Hidden mdDown>
                <div className={'h-full w-full'}>
                    <Switch>
                        <Route path={`${match.url}/session/:sid`}>
                            <Box className={'h-full flex flex-row'}>
                                <Box className={'flex flex-col w-4/12'}>
                                    <Box className={'h-24'}>
                                        <UserInfoHeader/>
                                    </Box>
                                    <Divider/>
                                    <Box overflow={"hidden"} className="BeautyScrollBar flex-1">
                                        <SessionListView/>
                                    </Box>
                                </Box>

                                <Box className={"h-full flex-1"}>
                                    <Divider orientation={"vertical"} style={{float: "left"}}/>
                                    <ChatRoomContainer/>
                                </Box>
                            </Box>
                        </Route>
                        <Route path={`${match.url}/friends`} children={<ContactsList/>}/>
                        <Route path={`${match.url}/square`} children={<Square/>}/>
                        <Route path={`${match.url}/session`} exact={true}>
                            <Redirect
                                to={`${match.url}/session/0`}/>
                        </Route>
                        <Route path={`${match.url}/`} exact={true}>
                            <Redirect to={`${match.url}/session/`}/>
                        </Route>
                    </Switch>
                </div>
            </Hidden>
            <Hidden mdUp>
                <MobileMain/>
            </Hidden>
        </div>
    )
});

const MobileMain = withRouter((props: RouteComponentProps) => {

    const match = useRouteMatch();
    const selected = window.location.href.match(/\/im\/(session\/?)$/g) != null ? 0 : 1;
    const isMainPage = window.location.href.match(/\/im\/(session\/?|profile\/?)$/g) != null;

    return (
        <Box bgcolor={grey[100]} width={'100%'}>
            <Switch>
                <Route path={`${match.url}/session`} exact={true}>
                    <Box height={"calc(100vh - 56px)"}>
                        <AppBar position="static">
                            <Toolbar>
                                <IconButton edge="start" color="inherit" aria-label="menu">
                                </IconButton>
                                <Typography variant="h6">
                                    会话
                                </Typography>
                            </Toolbar>
                        </AppBar>
                        <Box overflow={"hidden"} className="BeautyScrollBar">
                            <SessionListView/>
                        </Box>
                    </Box>
                </Route>
                <Route path={`${match.url}/profile`} exact>
                    <Box height={"calc(100vh - 56px)"}>
                        <Profile/>
                    </Box>
                </Route>
                <Route path={`${match.url}/session/:sid`}>
                    <ChatRoomContainerMobile/>
                </Route>
                <Route path={`${match.url}/`} exact={true}>
                    <Redirect to={`${match.url}/session/`}/>
                </Route>
            </Switch>
            {isMainPage ? <BottomNavigation value={selected} showLabels>
                <BottomNavigationAction label="聊天" icon={<MessageOutlined/>} onClick={() => {
                    props.history.replace(`/im/session`)
                }
                }/>
                <BottomNavigationAction label="我的" icon={<ManageAccountsOutlined/>} onClick={() => {
                    props.history.replace(`/im/profile`)
                }}/>
            </BottomNavigation> : <></>
            }
        </Box>
    )
})
