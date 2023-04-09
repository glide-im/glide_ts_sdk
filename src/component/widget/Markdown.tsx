import React from 'react';
import MarkdownRenderer from './MarkdownRender';

export interface MarkdownProps {
    source: string;
}

export const Markdown: React.FC<MarkdownProps> = ({source}) => {
    // const classes = useStyles();
    return <MarkdownRenderer>{source}</MarkdownRenderer>
};

export default Markdown;
