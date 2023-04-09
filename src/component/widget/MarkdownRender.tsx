import React from 'react';
import ReactMarkdown from 'react-markdown';
import {Box,} from "@mui/material";


export function MarkdownRenderer(props) {

    return (
        <Box width={'100%'} color={"black"}>
            <ReactMarkdown
                {...props}
            />
        </Box>
    );
}

export default MarkdownRenderer;
