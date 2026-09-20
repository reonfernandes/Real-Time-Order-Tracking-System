import { useEffect, useRef, useState } from 'react';
import { apiBaseUrl } from '../api/client';
import type { OrderResponse } from '../types';

/*
Opens the sse stream of one order and hands every update to onUpdate.

EventSource cannot set an Authorization header, so this works only because the backend
also puts the jwt in a cookie and allows credentials for this origin. If the cookie is
not there the connection fails and connected stays false, which is why the page keeps
the old polling around as a fallback.

Returns whether the stream is currently up.
 */
export const useOrderStream = (
    orderId: string,
    enabled: boolean,
    onUpdate: (order: OrderResponse) => void,
): boolean => {
    const [connected, setConnected] = useState(false);

    // kept in a ref so a new function on every render does not reopen the connection
    const handlerRef = useRef(onUpdate);
    useEffect(() => {
        handlerRef.current = onUpdate;
    });

    useEffect(() => {
        if (!enabled || !orderId) return;

        const source = new EventSource(`${apiBaseUrl}/api/v1/order/stream/${orderId}`, {
            withCredentials: true,
        });

        source.onopen = () => setConnected(true);

        source.addEventListener('status', (event) => {
            try {
                handlerRef.current(JSON.parse((event as MessageEvent).data) as OrderResponse);
                setConnected(true);
            } catch {
                // a payload we cannot read is not worth breaking the screen over
            }
        });

        // heartbeat from the backend, nothing to do with it other than knowing we are alive
        source.addEventListener('ping', () => setConnected(true));

        // browser retries on its own, so just report that we are down for now
        source.onerror = () => setConnected(false);

        return () => {
            source.close();
            setConnected(false);
        };
    }, [orderId, enabled]);

    return connected;
};
