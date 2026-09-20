import type { Location } from 'react-router';

const AUTH_PATHS = ['/login', '/register'];

// the whole location matters, dropping the query string loses page numbers and filters
export const fullPath = (location: Location) => `${location.pathname}${location.search}${location.hash}`;

/*
Where to drop the user after a successful login. Never back onto an auth page,
otherwise they bounce between login and register without ever reaching the app.
Anything that is not an in-app path is ignored, an open redirect is not worth the risk.
 */
export const redirectTarget = (from: unknown): string => {
    if (typeof from !== 'string') return '/orders';
    // "//evil.com" is a protocol relative url, it would leave the site
    if (!from.startsWith('/') || from.startsWith('//')) return '/orders';
    if (AUTH_PATHS.some((path) => from === path || from.startsWith(`${path}?`))) return '/orders';
    return from;
};
