import { Box, CircularProgress, List, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { RouteComponentProps, useParams, withRouter } from 'react-router-dom';
import { Account } from '../../im/account';
import { Session } from '../../im/session';
import { SessionListEventType } from '../../im/session_list';
import { SessionListItem } from './SessionListItem';

export const SessionListView: any = withRouter((props: RouteComponentProps) => {
    const { sid } = useParams<{ sid: string }>();
    const sessionList = Account.getInstance().getSessionList();
    const relativeList = Account.getInstance().getRelativeList();
    const [sessions, setSessions] = useState(sessionList.getSessionsTemped());
    const [loadSate, setLoadSate] = useState(true);
    const [loadError, setLoadError] = useState('');

    useEffect(() => {
        Account.session().setSelectedSession(sid);
    });

    useEffect(() => {
        const sp = sessionList.event().subscribe({
            next: (e) => {
                switch (e.event) {
                    case SessionListEventType.create:
                        setSessions(sessionList.getSessionsTemped());
                        break;
                    case SessionListEventType.update:
                        setSessions(sessionList.getSessionsTemped());
                        break;
                    case SessionListEventType.deleted:
                    case SessionListEventType.init:
                        break;
                }
            },
        });
        return () => sp.unsubscribe();
    }, [sessionList]);

    useEffect(() => {
        sessionList.getSessions().subscribe({
            next: (res: Session[]) => {
                setSessions(res);
            },
            error: (err) => {
                setLoadSate(false);
                setLoadError(err.toString());
            },
            complete: () => {
                setLoadSate(false);
            },
        });
    }, [sessionList]);

    const onSelect = (s: Session) => {
        s.clearUnread();
        sessionList.setSelectedSession(s.ID);
        props.history.push(`/im/session/${s.ID}`);
    };

    let content: JSX.Element;

    if (loadSate) {
        content = <Progress showProgress={true} msg={'Loading'} />;
    } else if (loadError) {
        content = <Progress showProgress={false} msg={loadError} />;
    } else if (sessions.length === 0) {
        content = <Progress showProgress={false} msg={'Empty...'} />;
    } else {
        content = (
            <List style={{ overflow: 'auto', height: '100%' }} disablePadding>
                {sessions?.map((value: Session) => (
                    <SessionListItem
                        key={value.ID}
                        chat={value}
                        onSelect={onSelect}
                    />
                ))}
            </List>
        );
    }

    return <>{content}</>;
});

function Progress(props: { showProgress?: boolean; msg?: string }) {
    return (
        <Box display={'flex'} flexDirection={'column'} paddingTop={'50%'}>
            {props.showProgress !== false ? (
                <CircularProgress style={{ margin: 'auto' }} />
            ) : (
                <></>
            )}
            {props.msg ? (
                <Typography variant={'caption'} textAlign={'center'}>
                    {props.msg}
                </Typography>
            ) : (
                <></>
            )}
        </Box>
    );
}
