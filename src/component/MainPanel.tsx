import {
    AppBar,
    BottomNavigation,
    BottomNavigationAction,
    Box, Button,
    Hidden,
    IconButton,
    Toolbar,
    Typography
} from "@mui/material";
import {grey} from "@mui/material/colors";
import React from "react";
import {Redirect, Route, RouteComponentProps, Switch, useRouteMatch, withRouter} from "react-router-dom";
import {Account} from "../im/account";
import {Chat} from "./chat/Chat";
import {ContactsList} from "./friends/ContactsList";
import {Square} from "./square/Square";
import {SessionListView} from "./chat/SessionListView";
import {ManageAccountsOutlined, MessageOutlined} from "@mui/icons-material";
import {ChatRoomContainerMobile} from "./chat/ChatRoom";
import { Profile } from "./Profile";


export const MainPanel = withRouter((props: RouteComponentProps) => {

    if (!Account.getInstance().isAuthenticated()) {
        props.history.push("/auth");
        return <></>
    }

    const match = useRouteMatch();

    return (
        <>
            <Hidden mdDown>
                <Box height={'100vh'} width={'100%'}>
                    <Switch>
                        <Route path={`${match.url}/session/:sid`} children={<Chat/>}/>
                        <Route path={`${match.url}/friends`} children={<ContactsList/>}/>
                        <Route path={`${match.url}/square`} children={<Square/>}/>
                        <Route path={`${match.url}/session`} exact={true}>
                            <Redirect
                                to={`${match.url}/session/${Account.getInstance().getSessionList().currentSession}`}/>
                        </Route>
                        <Route path={`${match.url}/`} exact={true}>
                            <Redirect to={`${match.url}/session/`}/>
                        </Route>
                    </Switch>
                </Box>
            </Hidden>
            <Hidden mdUp>
                <MobileMain/>
            </Hidden>
        </>
    )
});

const MobileMain = withRouter((props: RouteComponentProps) => {

    const match = useRouteMatch();
    const selected = window.location.hash.match(/\/im\/(session\/?)$/g) != null ? 0 : 1;
    const isMainPage = window.location.hash.match(/\/im\/(session\/?|profile\/?)$/g) != null;

    return (
        <Box  bgcolor={grey[100]} width={'100%'} height={'100vh'}>
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
                            <SessionListView selected={""} onSelect={null}/>
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
            {isMainPage ? <BottomNavigation value={selected} showLabels >
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
