import type { OrderStatus } from '../types';

interface StatusMeta {
    label: string;
    // what the customer is waiting for at this point
    note: string;
    bg: string;
    ink: string;
}

export const STATUS_META: Record<OrderStatus, StatusMeta> = {
    PENDING: {
        label: 'Pending',
        note: 'Order placed, payment not confirmed yet',
        bg: 'var(--status-pending-bg)',
        ink: 'var(--status-pending-ink)',
    },
    CONFIRMED: {
        label: 'Confirmed',
        note: 'Payment received',
        bg: 'var(--status-confirmed-bg)',
        ink: 'var(--status-confirmed-ink)',
    },
    PROCESSING: {
        label: 'Processing',
        note: 'Being prepared',
        bg: 'var(--status-processing-bg)',
        ink: 'var(--status-processing-ink)',
    },
    PACKED: {
        label: 'Packed',
        note: 'Sealed and labelled',
        bg: 'var(--status-packed-bg)',
        ink: 'var(--status-packed-ink)',
    },
    SHIPPED: {
        label: 'Shipped',
        note: 'Handed over to the courier',
        bg: 'var(--status-shipped-bg)',
        ink: 'var(--status-shipped-ink)',
    },
    OUT_FOR_DELIVERY: {
        label: 'Out for delivery',
        note: 'Courier is on the way',
        bg: 'var(--status-out-bg)',
        ink: 'var(--status-out-ink)',
    },
    DELIVERED: {
        label: 'Delivered',
        note: 'Received by the customer',
        bg: 'var(--status-delivered-bg)',
        ink: 'var(--status-delivered-ink)',
    },
    CANCELLED: {
        label: 'Cancelled',
        note: 'Order was cancelled',
        bg: 'var(--status-cancelled-bg)',
        ink: 'var(--status-cancelled-ink)',
    },
    RETURNED: {
        label: 'Returned',
        note: 'Sent back by the customer',
        bg: 'var(--status-returned-bg)',
        ink: 'var(--status-returned-ink)',
    },
};

// The happy path the order walks through, cancelled and returned sit outside it.
export const MAIN_FLOW: OrderStatus[] = [
    'PENDING',
    'CONFIRMED',
    'PROCESSING',
    'PACKED',
    'SHIPPED',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
];

/*
Same rules the backend keeps in ALLOWED_NEXT_STATUS. Duplicated here only to decide
what the buttons should show, the backend is still the one which validates.
 */
const ALLOWED_NEXT: Record<OrderStatus, OrderStatus[]> = {
    PENDING: ['CONFIRMED', 'CANCELLED'],
    CONFIRMED: ['PROCESSING', 'CANCELLED'],
    PROCESSING: ['PACKED', 'CANCELLED'],
    PACKED: ['SHIPPED', 'CANCELLED'],
    SHIPPED: ['OUT_FOR_DELIVERY'],
    OUT_FOR_DELIVERY: ['DELIVERED'],
    DELIVERED: ['RETURNED'],
    CANCELLED: [],
    RETURNED: [],
};

export const nextStatuses = (status: OrderStatus): OrderStatus[] => ALLOWED_NEXT[status] ?? [];

export const nextForwardStatus = (status: OrderStatus): OrderStatus | null =>
    nextStatuses(status).find((next) => next !== 'CANCELLED') ?? null;

export const isCancellable = (status: OrderStatus): boolean => nextStatuses(status).includes('CANCELLED');

export const isClosed = (status: OrderStatus): boolean =>
    status === 'CANCELLED' || status === 'RETURNED' || status === 'DELIVERED';
