import { Box, CircularProgress, Grid } from '@mui/material';
import React from 'react';

export function Loading(props: { msg?: string }) {
    return (
        <Grid container justifyContent={'center'}>
            <Box>
                <CircularProgress />
                {/*<Typography variant={"h5"} component={"p"}>{props.msg}</Typography>*/}
            </Box>
        </Grid>
    );
}
