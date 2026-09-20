import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { PackageSearch, Plus, RefreshCw } from 'lucide-react';
import { errorMessage } from '../../api/client';
import { fetchOrders } from '../../api/orders.api';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Pagination } from '../../components/ui/Pagination';
import { EmptyState, ErrorState, Spinner } from '../../components/ui/States';
import { OrderTable } from '../../components/orders/OrderTable';
import { isClosed } from '../../lib/status';
import type { OrderResponse, PageResponse } from '../../types';
import './orders.css';

const PAGE_SIZE = 10;

export const OrdersPage = () => {
    const [page, setPage] = useState(0);
    const [reloadKey, setReloadKey] = useState(0);
    const [data, setData] = useState<PageResponse<OrderResponse> | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    /*
    The spinner is switched on by whoever asks for the data, so the effect itself only
    sets state from the promise callbacks. The active flag drops a response which comes
    back after the page has already moved on.
     */
    useEffect(() => {
        let active = true;

        fetchOrders(page, PAGE_SIZE)
            .then((result) => {
                if (!active) return;
                setData(result);
                setError('');
            })
            .catch((err) => {
                if (active) setError(errorMessage(err, 'Could not load your orders.'));
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
        };
    }, [page, reloadKey]);

    const reload = () => {
        setLoading(true);
        setReloadKey((key) => key + 1);
    };

    const goToPage = (next: number) => {
        setLoading(true);
        setPage(next);
    };

    const orders = data?.content ?? [];
    const moving = orders.filter((order) => !isClosed(order.status)).length;
    const delivered = orders.filter((order) => order.status === 'DELIVERED').length;
    const cancelled = orders.filter((order) => order.status === 'CANCELLED').length;

    return (
        <div className="orders-page">
            <header className="orders-page__head">
                <div>
                    <h1 className="app-page-title">Your orders</h1>
                    <p className="app-page-subtitle">
                        {data ? `${data.totalElements} order${data.totalElements === 1 ? '' : 's'} placed so far` : 'Loading your orders'}
                    </p>
                </div>
                <div className="orders-page__actions">
                    <Button variant="secondary" icon={<RefreshCw size={16} />} onClick={reload}>
                        Refresh
                    </Button>
                    <Link to="/orders/new" className="btn btn--primary">
                        <Plus size={16} />
                        Place order
                    </Link>
                </div>
            </header>

            <div className="orders-page__stats">
                <div className="stat">
                    <span className="stat__label">In progress</span>
                    <span className="stat__value">{moving}</span>
                    <span className="stat__caption">on this page</span>
                </div>
                <div className="stat">
                    <span className="stat__label">Delivered</span>
                    <span className="stat__value">{delivered}</span>
                    <span className="stat__caption">on this page</span>
                </div>
                <div className="stat">
                    <span className="stat__label">Cancelled</span>
                    <span className="stat__value">{cancelled}</span>
                    <span className="stat__caption">on this page</span>
                </div>
            </div>

            <Card padded={false}>
                {loading ? <Spinner label="Fetching orders" /> : null}

                {!loading && error ? (
                    <ErrorState
                        message={error}
                        action={
                            <Button variant="secondary" onClick={reload}>
                                Try again
                            </Button>
                        }
                    />
                ) : null}

                {!loading && !error && orders.length === 0 ? (
                    <EmptyState
                        icon={<PackageSearch size={22} />}
                        title="No orders yet"
                        message="Once you place an order it shows up here with its live status."
                        action={
                            <Link to="/orders/new" className="btn btn--primary">
                                <Plus size={16} />
                                Place your first order
                            </Link>
                        }
                    />
                ) : null}

                {!loading && !error && orders.length > 0 ? (
                    <>
                        <OrderTable orders={orders} />
                        <Pagination
                            page={data?.number ?? 0}
                            totalPages={data?.totalPages ?? 1}
                            totalElements={data?.totalElements ?? 0}
                            onChange={goToPage}
                        />
                    </>
                ) : null}
            </Card>
        </div>
    );
};
