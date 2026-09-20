import { useNavigate } from 'react-router';
import { ChevronRight } from 'lucide-react';
import { StatusPill } from '../ui/StatusPill';
import { formatAmount, relativeTime, shortId } from '../../lib/format';
import type { OrderResponse } from '../../types';
import './order-table.css';

export const OrderTable = ({ orders }: { orders: OrderResponse[] }) => {
    const navigate = useNavigate();

    return (
        <div className="order-table">
            <div className="order-table__head">
                <span>Order</span>
                <span>Amount</span>
                <span>Status</span>
                <span>Updated</span>
                <span />
            </div>

            {orders.map((order) => (
                <button
                    key={order.id}
                    type="button"
                    className="order-table__row"
                    onClick={() => navigate(`/orders/${order.id}`)}
                >
                    <span className="order-table__order">
                        <span className="order-table__items">{order.items.join(', ')}</span>
                        <span className="order-table__id app-mono">#{shortId(order.id)}</span>
                    </span>
                    <span className="order-table__amount">{formatAmount(order.amount)}</span>
                    <span>
                        <StatusPill status={order.status} />
                    </span>
                    <span className="order-table__updated">{relativeTime(order.updateOn ?? order.createdOn)}</span>
                    <span className="order-table__chevron">
                        <ChevronRight size={17} />
                    </span>
                </button>
            ))}
        </div>
    );
};
