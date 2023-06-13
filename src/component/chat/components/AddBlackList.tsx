import {Box, MenuItem} from "@mui/material";
import GroupRemoveIcon from '@mui/icons-material/GroupRemove';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import React, {useEffect, useState} from "react";
import {showSnack} from "../../widget/SnackBar";
import {RelativeList} from "../../../im/relative_list";

const AddBlackList = (props) => {
    const relativeList: RelativeList = props.relativeList
    const relativeListByBlackIds = relativeList.getBlackRelativeListID();
    const [isBlackList, setIsBlackList] = useState<boolean>(relativeListByBlackIds.includes(props.uid.toString()))
    const uid: string = props.uid

    useEffect(() => {
        console.log('relativeList', relativeListByBlackIds, props.uid, relativeListByBlackIds.includes(props.uid))
    }, [])

    const add = () => {
        relativeList.addBlackRelativeList(uid)
            .subscribe({
                error: (e) => {
                    showSnack(e.toString())
                },
                complete: () => {
                    showSnack("添加成功")
                    setIsBlackList(true)
                    console.log(relativeList.getBlackRelativeListID())
                }
            })
    }

    const remove = () => {
        relativeList.removeBlackRelativeList(uid)
            .subscribe({
                error: (e) => {
                    showSnack(e.toString())
                },
                complete: () => {
                    showSnack("移出成功")
                    setIsBlackList(false)
                    console.log(relativeList.getBlackRelativeListID())
                }
            })
    }

    const toggleBlackList=  () => {
        if(isBlackList) {
            remove()
        }else {
            add()
        }
    }

    useEffect(() => {
        props.updateIsBlackList(isBlackList)
    }, [isBlackList])

    return <MenuItem onClick={() => toggleBlackList()}>
        {
            isBlackList ?
                <><GroupRemoveIcon/><Box m={1}>移出黑名单</Box></> :
                <><GroupAddIcon/><Box m={1}>加入黑名单</Box></>
        }
    </MenuItem>
}

export default AddBlackList