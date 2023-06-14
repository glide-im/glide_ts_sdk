import { Box, List, ListItem, Typography } from '@mui/material';
import React, { useEffect, useRef, useState } from 'react';
import { ChatMessageItem } from './Message';
import { ChatMessage } from '../../im/chat_message';
import { useParams } from 'react-router-dom';
import { Session, SessionEventType } from '../../im/session';
import { Account } from '../../im/account';
import { ChatContext } from './context/ChatContext';
import { filter } from 'rxjs';

export function SessionMessageList() {
    const { sid } = useParams<{ sid: string }>();
    const [session, setSession] = React.useState<Session | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>(
        session?.getMessages() ?? []
    );
    const scrollRef = useRef() as React.MutableRefObject<HTMLDivElement>;
    const messageListEle = useRef<HTMLUListElement>();

    const scrollToBottom = async () => {
        if (scrollRef.current)
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    };

    useEffect(() => {
        scrollToBottom().then();
    }, [messages]);

    useEffect(() => {
        setSession(Account.session().get(sid));
    }, [sid]);

    useEffect(() => {
        const sp = session?.event
            .pipe(
                filter((e) => e.type === SessionEventType.ReloadMessageHistory)
            )
            .subscribe((e) => {
                setMessages([...session.getMessages()]);
            });
        return () => sp?.unsubscribe();
    }, [session]);

    useEffect(() => {
        if (session === null) {
            return;
        }
        setMessages(session.getMessages());
        const sp = session.messageSubject.subscribe((msg) => {
            setMessages([...session.getMessages()]);
        });
        return () => sp.unsubscribe();
    }, [session]);

    if (sid === '1') {
        // loadHistory()
    }

    if (session == null) {
        return (
            <Box mt={'50%'}>
                <Typography variant='h6' textAlign={'center'}>
                    选择一个会话开始聊天
                </Typography>
            </Box>
        );
    }

    const list = messages.map((value) => {
        if (typeof value === 'string') {
            return (
                <ListItem key={value}>
                    <Box width={'100%'}>
                        <Typography
                            key={value}
                            variant={'body2'}
                            textAlign={'center'}>
                            {value}
                        </Typography>
                    </Box>
                </ListItem>
            );
        }
        return (
            <ListItem key={value.getId()} sx={{ padding: '0' }}>
                <ChatMessageItem msg={value} />
            </ListItem>
        );
    });

    return (
        <ChatContext.Provider value={{ scrollToBottom }}>
            <Box
                ref={scrollRef}
                className={
                    'BeautyScrollBar flex w-full max-h-full overflow-y-scroll flex-col-reverse'
                }>
                <List disablePadding ref={messageListEle} className={'w-full'}>
                    {list}
                </List>
            </Box>
        </ChatContext.Provider>
    );
}
