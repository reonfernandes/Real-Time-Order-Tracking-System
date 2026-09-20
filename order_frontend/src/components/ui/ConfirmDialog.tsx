import { Button } from './Button';
import './confirm-dialog.css';

interface ConfirmDialogProps {
    open: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    loading?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export const ConfirmDialog = ({
    open,
    title,
    message,
    confirmLabel = 'Confirm',
    loading = false,
    onConfirm,
    onCancel,
}: ConfirmDialogProps) => {
    if (!open) return null;

    return (
        <div className="dialog-backdrop" role="dialog" aria-modal="true" aria-label={title}>
            <div className="dialog">
                <h2 className="dialog__title">{title}</h2>
                <p className="dialog__message">{message}</p>
                <div className="dialog__actions">
                    <Button variant="secondary" onClick={onCancel} disabled={loading}>
                        Keep it
                    </Button>
                    <Button variant="danger" onClick={onConfirm} loading={loading}>
                        {confirmLabel}
                    </Button>
                </div>
            </div>
        </div>
    );
};
