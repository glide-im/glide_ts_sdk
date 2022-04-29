import { Box, Typography } from "@mui/material"
import { useEffect, useState } from "react"

export function Version() {

    const [version, setVersion] = useState("")

    useEffect(() => {
        fetch("/build-date.log")
            .then(r => {
                console.log(r)
                return r.text()
            })
            .then(r => {
                setVersion(r)
            })
            .catch(e => {
                setVersion("-")
            })
    }, [])

    return <Box>
        <Typography variant="caption">build: {version}</Typography>
    </Box>
}