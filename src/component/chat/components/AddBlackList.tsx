import {Box, MenuItem} from "@mui/material";
import {PersonAddOutlined} from "@mui/icons-material";
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
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

    return <MenuItem onClick={() => toggleBlackList()}>
        {
            isBlackList ?
                <><PersonAddIcon/><Box m={1}>移出黑名单</Box></> :
                <><PersonAddOutlined/><Box m={1}>加入黑名单</Box></>
        }
    </MenuItem>
}

export default AddBlackList