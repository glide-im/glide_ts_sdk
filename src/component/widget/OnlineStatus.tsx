import { useEffect, useState } from 'react';
import { Typography } from '@mui/material';
import { Account } from '../../im/account';

export function OnlineStatus(props: { sid: string }) {
    const [online, setOnline] = useState<boolean | null>(null);

    useEffect(() => {
        const session = Account.session().get(props.sid);
        if (session === null) {
            return;
        }
        const sp = session.event.pipe().subscribe({
            next: (e) => {},
        });
        return () => sp.unsubscribe();
    }, [props.sid]);

    if (online === null) {
        return <></>;
    }
    return (
        <Typography variant={'body2'} component={'span'}>
            {online ? '在线' : '离线'}
        </Typography>
    );
}
