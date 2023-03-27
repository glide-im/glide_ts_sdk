
import { Dialog, DialogContent } from '@material-ui/core';

interface ImageViewerProps {
  open: boolean;
  onClose: () => void;
  imageUrl: string;
}

export function ImageViewer(props: ImageViewerProps) {
  return (
    <Dialog open={props.open} onClose={props.onClose} fullWidth maxWidth="xl">
      <DialogContent>
        <img src={props.imageUrl} alt="Image" style={{ width: '100%', height: '100%' }} />
      </DialogContent>
    </Dialog>
  );
}
