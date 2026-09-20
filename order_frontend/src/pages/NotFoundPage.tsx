import { Link } from 'react-router';
import { Compass } from 'lucide-react';
import { EmptyState } from '../components/ui/States';
import { Card } from '../components/ui/Card';

/*
Every unknown url used to be redirected straight to /orders, which quietly swallowed
typos and dead links. Showing the url instead makes it obvious what went wrong.
 */
export const NotFoundPage = () => (
    <Card padded={false}>
        <EmptyState
            icon={<Compass size={22} />}
            title="This page does not exist"
            message={`Nothing is mapped to ${window.location.pathname}.`}
            action={
                <Link to="/orders" className="btn btn--primary">
                    Back to your orders
                </Link>
            }
        />
    </Card>
);
