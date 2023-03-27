import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import ReactMarkdown from 'react-markdown';
import { Variant } from '@mui/material/styles/createTypography';

const useStyles = makeStyles((theme) => ({
    root: {
        '& h1': {
            marginTop: theme.spacing(4),
            marginBottom: theme.spacing(2),
        },
        '& h2': {
            marginTop: theme.spacing(3),
            marginBottom: theme.spacing(2),
        },
        '& h3': {
            marginTop: theme.spacing(3),
            marginBottom: theme.spacing(2),
        },
        '& h4': {
            marginTop: theme.spacing(3),
            marginBottom: theme.spacing(2),
        },
        '& h5': {
            marginTop: theme.spacing(2),
            marginBottom: theme.spacing(1.5),
        },
        '& h6': {
            marginTop: theme.spacing(2),
            marginBottom: theme.spacing(1.5),
        },
        '& p': {
            marginTop: theme.spacing(1.5),
            marginBottom: theme.spacing(1.5),
        },
        '& ul': {
            marginTop: theme.spacing(1.5),
            marginBottom: theme.spacing(1.5),
            paddingLeft: theme.spacing(3),
        },
        '& ol': {
            marginTop: theme.spacing(1.5),
            marginBottom: theme.spacing(1.5),
            paddingLeft: theme.spacing(3),
        },
        '& li': {
            marginTop: theme.spacing(0.75),
            marginBottom: theme.spacing(0.75),
        },
        '& a': {
            color: theme.palette.primary.main,
            textDecoration: 'none',
        },
        '& a:hover': {
            textDecoration: 'underline',
        },
        '& blockquote': {
            // borderLeft: `4px solid ${theme.palette.grey[500]}`,
            // backgroundColor: theme.palette.grey[100],
            padding: theme.spacing(1, 2),
            margin: theme.spacing(2, 0),
        },
        '& pre': {
            borderRadius: 4,
            backgroundColor: '#f5f5f5',
            padding: theme.spacing(1),
            overflowX: 'auto',
        },
        '& code': {
            overflowX: 'auto',
            fontFamily: ['Consolas', 'Monaco', 'source-code-pro', 'Courier New', 'monospace'],
            fontSize: 14,
            padding: theme.spacing(0.2, 0.5),
            color: theme.palette.text.primary,
            borderRadius: 4,
            whiteSpace: 'no-wrap', 
        },
    },
}));

export function MarkdownRenderer(props) {
    const classes = useStyles();

    return (
        <Box className={classes.root} color={"black"}>
            <ReactMarkdown
                {...props}
                renderers={{
                    root: ({ children }) => <Typography component="div">{children}</Typography>,
                    paragraph: ({ children }) => <Typography variant="body1">{children}</Typography>,
                    heading: ({ level, children }) => {
                        const variant: Variant | null = `h${level}` as Variant | null;
                        return (
                            <Typography variant={variant} gutterBottom>
                                {children}
                            </Typography>
                        );
                    },
                    link: ({ href, children }) => (
                        <Typography variant="body1" component="a" href={href} target="_blank" rel="noopener">
                            {children}
                        </Typography>
                    ),
                    list: ({ ordered, children }) => {
                        const Component = ordered ? 'ol' : 'ul';
                        return <Box component={Component}>{children}</Box>;
                    },
                    listItem: ({ children }) => (
                        <Box component="li">
                            <Typography variant="body1">{children}</Typography>
                        </Box>
                    ),
                    blockquote: ({ children }) => <blockquote>{children}</blockquote>,
                    code: ({ language, value }) => (
                        <pre>
                            <code className={`language-${language}`}>{value}</code>
                        </pre>
                    ),
                }}
            />
        </Box>
    );
}

export default MarkdownRenderer;
