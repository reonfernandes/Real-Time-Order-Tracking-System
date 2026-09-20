export const formatAmount = (amount: number): string =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amount);

export const formatDateTime = (value?: string | null): string => {
    if (!value) return '--';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '--';
    return date.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    });
};

export const formatTime = (value?: string | null): string => {
    if (!value) return '--:--';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '--:--';
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
};

// mongo ids are long, showing the last 8 characters is enough to tell orders apart
export const shortId = (id: string): string => (id.length > 8 ? id.slice(-8) : id);

export const relativeTime = (value?: string | null): string => {
    if (!value) return '--';
    const then = new Date(value).getTime();
    if (Number.isNaN(then)) return '--';

    const minutes = Math.round((Date.now() - then) / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes} min ago`;

    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours} hr ago`;

    const days = Math.round(hours / 24);
    return days === 1 ? 'yesterday' : `${days} days ago`;
};
