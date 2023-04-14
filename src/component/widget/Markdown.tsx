import React from 'react';
import ReactMarkdown from "react-markdown";
import {Box, Typography} from "@mui/material";
import SyntaxHighlighter from 'react-syntax-highlighter';
import {darcula} from 'react-syntax-highlighter/dist/esm/styles/hljs';

export interface MarkdownProps {
    source: string;
}

export const Markdown: React.FC<MarkdownProps> = ({source}) => {

    // const classes = useStyles();
    return <ReactMarkdown components={{
        img: ({node, ...props}) => <img {...props} style={{maxWidth: "100%"}} alt={'-'}/>,
        // a: ({node, ...props}) => <a {...props} target={"_blank"}/>,
        p: ({node, ...props}) => <Typography {...props} variant={"body1"} className={'leading-relaxed'}/>,
        // h1: ({node, ...props}) => <Typography {...props} variant={"h6"}/>,
        // h2: ({node, ...props}) => <Typography {...props} variant={"h6"}/>,
        // h3: ({node, ...props}) => <Typography {...props} variant={"h6"}/>,
        // h4: ({node, ...props}) => <Typography {...props} variant={"h6"}/>,
        // h5: ({node, ...props}) => <Typography {...props} variant={"h6"}/>,
        // h6: ({node, ...props}) => <Typography {...props} variant={"h6"}/>,
        // li: ({node, ...props}) => <li className={'list-none'}  {...props}/>,
        ul: ({node, ...props}) => <ul className={'list-disc'} {...props} />,
        ol: ({node, ...props}) => <ul className={'list-decimal'} {...props} />,
        // blockquote: ({node, ...props}) => <Typography {...props} variant={"body1"}/>,
        // table: ({node, ...props}) => <Typography {...props} variant={"body1"}/>,
        // tr: ({node, ...props}) => <Typography {...props} variant={"body1"}/>,
        // td: ({node, ...props}) => <Typography {...props} variant={"body1"}/>,
        // th: ({node, ...props}) => <Typography {...props} variant={"body1"}/>,
        // code: ({node, ...props}) => <code {...props} style={{maxHeight: '400px'}}/>,
        code: ({node, ...props}) => <Highlight {...props} />,
        // pre: ({node, ...props}) => <Typography {...props} variant={"body1"}/>,
    }}>{source}</ReactMarkdown>
};

function Highlight(props: any) {
    const language = props.className?.replace(/language-/, '') || 'text';
    return <Box>
        <SyntaxHighlighter lineNumberStyle={{color: '#ddd'}} {...props} startingLineNumber={1} showLineNumbers={true}
                           language={language}
                           style={darcula}/>
    </Box>
}
