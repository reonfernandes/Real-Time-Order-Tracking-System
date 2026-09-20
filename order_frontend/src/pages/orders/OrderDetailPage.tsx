import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { errorMessage } from '../../api/client';
import { cancelOrder, fetchOrderById, updateOrderStatus } from '../../api/orders.api';
import { useAuth } from '../../context/useAuth';
import { useToast } from '../../context/useToast';
import { useOrderStream } from '../../hooks/useOrderStream';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { ErrorState, Spinner } from '../../components/ui/States';
import { StatusPill } from '../../components/ui/StatusPill';
import { StatusTimeline } from '../../components/orders/StatusTimeline';
import { formatAmount, formatDateTime } from '../../lib/format';
import { STATUS_META, isCancellable, isClosed, nextForwardStatus } from '../../lib/status';
import type { OrderResponse } from '../../types';
import './order-detail.css';

// only used when the stream is not available, see the comment on the polling effect
const REFRESH_MS = 8000;

export const OrderDetailPage = () => {
    const { orderId = '' } = useParams();
    const navigate = useNavigate();
    const { notify } = useToast();
    const { session } = useAuth();

    const [order, setOrder] = useState<OrderResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [working, setWorking] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);

    /*
    First load, and again whenever the refresh button bumps the key. State is set from
    the promise callbacks only, and the active flag ignores a late response.
     */
    useEffect(() => {
        let active = true;

        fetchOrderById(orderId)
            .then((fresh) => {
                if (!active) return;
                setOrder(fresh);
                setError('');
            })
            .catch((err) => {
                if (active) setError(errorMessage(err, 'Could not load this order.'));
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
        };
    }, [orderId, reloadKey]);

    const open = Boolean(order) && !isClosed(order?.status ?? 'PENDING');

    // stable, otherwise the hook would tear the connection down on every render
    const applyUpdate = useCallback((fresh: OrderResponse) => setOrder(fresh), []);

    // while this is up the backend pushes every status change as it happens
    const streaming = useOrderStream(orderId, open, applyUpdate);

    /*
    Fallback only. If the stream is up nothing polls, if it is not (old browser, cookie
    missing, proxy in between) the order is fetched again every few seconds so the screen
    still moves.
     */
    useEffect(() => {
        if (!open || streaming) return;

        const timer = window.setInterval(() => {
            fetchOrderById(orderId)
                .then(setOrder)
                .catch(() => {
                    // a failed background refresh should not disturb what is on screen
                });
        }, REFRESH_MS);

        return () => window.clearInterval(timer);
    }, [open, streaming, orderId]);

    const handleAdvance = async () => {
        if (!order) return;
        const next = nextForwardStatus(order.status);
        if (!next) return;

        setWorking(true);
        try {
            setOrder(await updateOrderStatus(order.id, next));
            notify(`Status moved to ${STATUS_META[next].label.toLowerCase()}.`);
        } catch (err) {
            notify(errorMessage(err, 'Could not update the status.'), 'error');
        } finally {
            setWorking(false);
        }
    };

    const handleCancel = async () => {
        if (!order) return;

        setWorking(true);
        try {
            await cancelOrder(order.id);
            notify('Order cancelled.');
            setConfirmOpen(false);
            setReloadKey((key) => key + 1);
        } catch (err) {
            notify(errorMessage(err, 'Could not cancel this order.'), 'error');
        } finally {
            setWorking(false);
        }
    };

    if (loading) return <Spinner label="Loading order" />;

    if (error || !order) {
        return (
            <ErrorState
                message={error || 'This order is not available.'}
                action={
                    <Button variant="secondary" onClick={() => navigate('/orders')}>
                        Back to orders
                    </Button>
                }
            />
        );
    }

    const next = nextForwardStatus(order.status);
    const live = !isClosed(order.status);
    const liveLabel = streaming ? 'Live' : 'Auto refreshing';
    const liveHint = streaming
        ? 'Connected to the order stream, updates arrive as they happen'
        : `Stream not available, checking every ${REFRESH_MS / 1000} seconds`;

    return (
        <div className="order-detail">
            <button type="button" className="new-order__back" onClick={() => navigate('/orders')}>
                <ArrowLeft size={15} />
                All orders
            </button>

            <header className="order-detail__head">
                <div className="order-detail__title">
                    <div className="order-detail__title-row">
                        <h1 className="app-page-title">{order.items.join(', ')}</h1>
                        <StatusPill status={order.status} size="md" />
                    </div>
                    <p className="app-page-subtitle app-mono">
                        {order.id} &middot; {formatAmount(order.amount)}
                    </p>
                </div>

                {live ? (
                    <span className={`order-detail__live ${streaming ? '' : 'order-detail__live--polling'}`} title={liveHint}>
                        <span className="order-detail__live-dot" />
                        {liveLabel}
                    </span>
                ) : null}
            </header>

            <div className="order-detail__grid">
                <Card title="Status timeline" action={
                    <Button variant="ghost" icon={<RefreshCw size={15} />} onClick={() => setReloadKey((key) => key + 1)}>
                        Refresh
                    </Button>
                }>
                    <StatusTimeline status={order.status} timeStamps={order.timeStamps ?? {}} />
                </Card>

                <div className="order-detail__side">
                    <Card title="Order details">
                        <dl className="summary">
                            <div className="summary__row">
                                <dt>Items</dt>
                                <dd>{order.items.length}</dd>
                            </div>
                            <div className="summary__row">
                                <dt>Amount</dt>
                                <dd>{formatAmount(order.amount)}</dd>
                            </div>
                            <div className="summary__row">
                                <dt>Placed on</dt>
                                <dd>{formatDateTime(order.createdOn)}</dd>
                            </div>
                            <div className="summary__row">
                                <dt>Last update</dt>
                                <dd>{formatDateTime(order.updateOn ?? order.createdOn)}</dd>
                            </div>
                        </dl>
                    </Card>

                    <Card title="Actions">
                        <div className="order-detail__actions">
                            {/* moving an order along is an admin job now, a customer can only cancel */}
                            {next && session?.isAdmin ? (
                                <Button block loading={working} onClick={handleAdvance}>
                                    Move to {STATUS_META[next].label.toLowerCase()}
                                </Button>
                            ) : null}

                            {next && !session?.isAdmin ? (
                                <p className="order-detail__closed">
                                    {STATUS_META[order.status].note}. The next step shows up here on its own.
                                </p>
                            ) : null}

                            {!next ? (
                                <p className="order-detail__closed">
                                    {STATUS_META[order.status].note}. Nothing more to do here.
                                </p>
                            ) : null}

                            {isCancellable(order.status) ? (
                                <Button variant="danger" block onClick={() => setConfirmOpen(true)} disabled={working}>
                                    Cancel this order
                                </Button>
                            ) : null}
                        </div>
                    </Card>
                </div>
            </div>

            <ConfirmDialog
                open={confirmOpen}
                title="Cancel this order?"
                message="The order stays in your history as cancelled and you will get a mail about it. This cannot be undone."
                confirmLabel="Yes, cancel it"
                loading={working}
                onConfirm={handleCancel}
                onCancel={() => setConfirmOpen(false)}
            />
        </div>
    );
};
