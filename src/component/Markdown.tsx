import React from 'react';
import {makeStyles} from '@material-ui/core/styles';
import MarkdownRenderer from './MarkdownRender';

const useStyles = makeStyles((theme) => ({
    root: {
        '& pre': {
            backgroundColor: '#f5f5f5',
            borderRadius: theme.shape.borderRadius,
            overflow: 'auto',
        },
    },
}));

export interface MarkdownProps {
    source: string;
}

export const Markdown: React.FC<MarkdownProps> = ({source}) => {
    // const classes = useStyles();
    return <MarkdownRenderer>{source}</MarkdownRenderer>
};

export default Markdown;
