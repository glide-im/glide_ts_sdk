import { Box, MenuItem } from '@mui/material';
import GroupRemoveIcon from '@mui/icons-material/GroupRemove';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import React, { useEffect, useState } from 'react';
import { showSnack } from '../../widget/SnackBar';
import { Event, RelativeList } from '../../../im/relative_list';
import { Logger } from '../../../utils/Logger';

const AddBlackList = (props) => {
    const relativeList: RelativeList = props.relativeList;
    const relativeListByBlackIds = relativeList.getBlackRelativeListID();
    const [isBlackList, setIsBlackList] = useState<boolean>(false);
    const uid: string = props.uid;

    const add = () => {
        relativeList.addBlackRelativeList(uid).subscribe({
            error: (e) => {
                showSnack(e.toString());
            },
            next: (e) => {
                Logger.log('AddBlackList:', e);
            },
            complete: () => {
                showSnack('添加成功');
                // setIsBlackList(true)
                console.log(relativeList.getBlackRelativeListID());
            },
        });
    };

    const remove = () => {
        relativeList.removeBlackRelativeList(uid).subscribe({
            error: (e) => {
                showSnack(e.toString());
            },
            complete: () => {
                showSnack('移出成功');
                console.log(relativeList.getBlackRelativeListID());
            },
            next: (e) => {
                Logger.log('RemoveBlackList:', e);
            },
        });
    };

    const toggleBlackList = () => {
        if (isBlackList) {
            remove();
        } else {
            add();
        }
    };

    useEffect(() => {
        props.updateIsBlackList(isBlackList);
    }, [isBlackList]);

    useEffect(() => {
        setIsBlackList(false);
        console.log(
            'relativeList',
            relativeListByBlackIds,
            props.uid,
            relativeListByBlackIds.includes(props.uid)
        );
        setIsBlackList(relativeList.inUserBlackList(props.uid));
    }, [props.uid]);

    useEffect(() => {
        const sb = relativeList.event(Event.BlackListUpdate).subscribe({
            next: (e) => {
                console.log(relativeList.inUserBlackList(props.uid));
                setIsBlackList(relativeList.inUserBlackList(props.uid));
            },
        });

        return () => sb.unsubscribe();
    }, []);

    return (
        <MenuItem onClick={() => toggleBlackList()}>
            {isBlackList ? (
                <>
                    <GroupRemoveIcon />
                    <Box m={1}>移出黑名单</Box>
                </>
            ) : (
                <>
                    <GroupAddIcon />
                    <Box m={1}>加入黑名单</Box>
                </>
            )}
        </MenuItem>
    );
};

export default AddBlackList;
