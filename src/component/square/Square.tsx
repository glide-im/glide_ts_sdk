import {
    Avatar,
    Box,
    Card,
    CircularProgress,
    Divider,
    Grid,
    Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { OnlineUserInfoBean, ServerInfoBean } from '../../api/model';
import { Account } from '../../im/account';
import { GlideBaseInfo } from '../../im/def';
import { Api } from '../../api/api';
import { Cache } from '../../im/cache';

export function Square() {
    const [serverInfo, setServerInfo] = useState<ServerInfoBean | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        Api.getServerInfo().subscribe({
            next: (data) => {
                setServerInfo(data);
            },
            error: (err) => {
                setError(err.message);
            },
        });
    }, []);

    let content = <></>;

    let servInfo = <></>;

    if (serverInfo == null) {
        content = (
            <Grid
                container
                justifyContent={'center'}
                flexDirection='column'
                textAlign={'center'}
                style={{ paddingTop: '100px' }}>
                {error != null ? (
                    <Typography variant='h6' textAlign='center'>
                        {' '}
                        {error}
                    </Typography>
                ) : (
                    <Box>
                        <CircularProgress />
                    </Box>
                )}
            </Grid>
        );
    } else {
        const users = serverInfo.OnlineCli.map((u) => {
            return (
                <Grid item xs={3}>
                    <UserCard u={u} />
                </Grid>
            );
        });

        const now = Date.parse(new Date().toString()) / 1000;
        const runHours = ((now - serverInfo.StartAt) / 60 / 60).toFixed(1);

        servInfo = (
            <Grid
                container
                spacing={2}
                gridRow={4}
                columns={1}
                style={{ padding: '20px' }}>
                <Grid item xs={12}>
                    <Typography>Online: {serverInfo.Online}</Typography>
                </Grid>
                <Grid item xs={12}>
                    <Typography>MaxOnline: {serverInfo.MaxOnline}</Typography>
                </Grid>
                <Grid item xs={12}>
                    <Typography>
                        MessageCount: {serverInfo.MessageSent}
                    </Typography>
                </Grid>
                <Grid item xs={12}>
                    <Typography>ServerRunning: {runHours} Hour</Typography>
                </Grid>
            </Grid>
        );

        content = (
            <Grid
                container
                textAlign={'center'}
                style={{ padding: '20px' }}
                spacing={2}>
                {users}
            </Grid>
        );
    }

    return (
        <Grid container height={'100%'}>
            <Grid item xs={4}>
                <Box m={2}>
                    <Typography variant={'caption'}>在线</Typography>
                </Box>
                <Divider />
                {servInfo}
            </Grid>
            <Grid item xs={8} height={'100%'}>
                <Divider orientation={'vertical'} style={{ float: 'left' }} />
                <Box style={{ overflow: 'auto' }} height={'100%'}>
                    {content}
                </Box>
            </Grid>
        </Grid>
    );
}


function UserCard(props: { u: OnlineUserInfoBean }) {

    const [user, setUser] = useState<GlideBaseInfo | null>(null)

    useEffect(() => {
        Cache.loadUserInfo(props.u.ID)
            .subscribe({
                next: (data) => {
                    setUser(data[0])
                },
            })
    }, [props.u.ID])

    const onClick = () => {
        Account.getInstance().getSessionList()
    }

    return <Card style={{ padding: "16px", cursor: "pointer" }} onClick={onClick}>
        <Box mt={"8px"}><Avatar style={{ margin: "auto" }} src={user?.avatar} /></Box>
        <Box mt={"8px"}><Typography variant="body2">Name: {user?.name}</Typography></Box>
        <Box mt={"4px"}><Typography variant="body2">ID: {props.u.ID}</Typography></Box>
    </Card>
}