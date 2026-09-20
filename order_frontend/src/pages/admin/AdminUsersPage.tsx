import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Search, X } from 'lucide-react';
import { errorMessage } from '../../api/client';
import { fetchUserByEmail, fetchUserById, fetchUsers } from '../../api/admin.api';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Pagination } from '../../components/ui/Pagination';
import { EmptyState, ErrorState, Spinner } from '../../components/ui/States';
import { formatDateTime, shortId } from '../../lib/format';
import type { PageResponse, UserResponse } from '../../types';
import './admin.css';

const PAGE_SIZE = 10;

const UserRows = ({ users }: { users: UserResponse[] }) => (
    <div className="user-table">
        <div className="user-table__head">
            <span>User</span>
            <span>Roles</span>
            <span>Orders</span>
            <span>Joined</span>
        </div>
        {users.map((user) => (
            <div key={user.id} className="user-table__row">
                <span className="user-table__user">
                    <span className="user-table__name">{user.name}</span>
                    <span className="user-table__email">{user.email}</span>
                    <span className="user-table__id app-mono">#{shortId(user.id)}</span>
                </span>
                <span className="user-table__roles">
                    {user.roles.map((role) => (
                        <span key={role} className={`role role--${role.toLowerCase()}`}>
                            {role}
                        </span>
                    ))}
                </span>
                <span>{user.totalOrders}</span>
                <span className="user-table__joined">{formatDateTime(user.createdOn)}</span>
            </div>
        ))}
    </div>
);

export const AdminUsersPage = () => {
    const [page, setPage] = useState(0);
    const [reloadKey, setReloadKey] = useState(0);
    const [data, setData] = useState<PageResponse<UserResponse> | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [query, setQuery] = useState('');
    const [searching, setSearching] = useState(false);
    const [searchHit, setSearchHit] = useState<UserResponse | null>(null);
    const [searchError, setSearchError] = useState('');

    // same as the orders page, nothing is set before the first await
    // same idea as the orders page, state is only touched from the promise callbacks
    useEffect(() => {
        let active = true;

        fetchUsers(page, PAGE_SIZE)
            .then((result) => {
                if (!active) return;
                setData(result);
                setError('');
            })
            .catch((err) => {
                if (active) setError(errorMessage(err, 'Could not load the users.'));
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

    // an email goes to the email endpoint, anything else is treated as an id
    const handleSearch = async (event: FormEvent) => {
        event.preventDefault();
        const value = query.trim();
        if (!value) return;

        setSearching(true);
        setSearchError('');
        setSearchHit(null);

        try {
            setSearchHit(value.includes('@') ? await fetchUserByEmail(value) : await fetchUserById(value));
        } catch (err) {
            setSearchError(errorMessage(err, 'No user found for that.'));
        } finally {
            setSearching(false);
        }
    };

    const clearSearch = () => {
        setQuery('');
        setSearchHit(null);
        setSearchError('');
    };

    const users = data?.content ?? [];

    return (
        <div className="admin-page">
            <header>
                <h1 className="app-page-title">Users</h1>
                <p className="app-page-subtitle">
                    {data ? `${data.totalElements} registered` : 'Loading users'} &middot; admin only
                </p>
            </header>

            <Card title="Find a user" action={searchHit || searchError ? (
                <Button variant="ghost" icon={<X size={15} />} onClick={clearSearch}>
                    Clear
                </Button>
            ) : null}>
                <form className="admin-search" onSubmit={handleSearch}>
                    <input
                        className="field__input"
                        placeholder="Search by email or user id"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        aria-label="Search by email or user id"
                    />
                    <Button type="submit" icon={<Search size={16} />} loading={searching}>
                        Search
                    </Button>
                </form>

                {searchError ? <p className="admin-search__error">{searchError}</p> : null}

                {searchHit ? (
                    <div className="admin-search__hit">
                        <UserRows users={[searchHit]} />
                    </div>
                ) : null}
            </Card>

            <Card padded={false}>
                {loading ? <Spinner label="Fetching users" /> : null}

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

                {!loading && !error && users.length === 0 ? <EmptyState title="No users to show" /> : null}

                {!loading && !error && users.length > 0 ? (
                    <>
                        <UserRows users={users} />
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
