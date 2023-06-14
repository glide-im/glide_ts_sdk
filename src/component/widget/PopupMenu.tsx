import { ReactNode } from 'react';

interface ContainerProps {
    children: ReactNode;
    backgroundColor: string;
}

const PopupMenu = ({ children, backgroundColor }: ContainerProps) => {
    const style = {
        backgroundColor,
        padding: '10px',
    };

    return <div style={style}>{children}</div>;
};

export default PopupMenu;
