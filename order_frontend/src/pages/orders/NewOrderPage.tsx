import { useState } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Plus, X } from 'lucide-react';
import { errorMessage } from '../../api/client';
import { createOrder } from '../../api/orders.api';
import { useToast } from '../../context/useToast';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Field } from '../../components/ui/Field';
import { formatAmount } from '../../lib/format';
import './new-order.css';

export const NewOrderPage = () => {
    const navigate = useNavigate();
    const { notify } = useToast();

    const [items, setItems] = useState<string[]>([]);
    const [draft, setDraft] = useState('');
    const [amount, setAmount] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const addItem = () => {
        const value = draft.trim();
        if (!value || items.includes(value)) {
            setDraft('');
            return;
        }
        setItems((current) => [...current, value]);
        setDraft('');
    };

    const removeItem = (item: string) => setItems((current) => current.filter((entry) => entry !== item));

    // enter should add the item, not submit the whole form
    const handleDraftKey = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            addItem();
        }
    };

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        setError('');

        if (items.length === 0) {
            setError('Add at least one item before placing the order.');
            return;
        }

        const parsedAmount = Number(amount);
        if (!amount || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
            setError('Amount has to be a number greater than zero.');
            return;
        }

        setLoading(true);
        try {
            const order = await createOrder({ items, amount: parsedAmount });
            notify('Order placed, confirmation mail is on its way.');
            navigate(`/orders/${order.id}`, { replace: true });
        } catch (err) {
            setError(errorMessage(err, 'Could not place the order.'));
        } finally {
            setLoading(false);
        }
    };

    const parsedAmount = Number(amount);
    const amountPreview = amount && !Number.isNaN(parsedAmount) && parsedAmount > 0 ? formatAmount(parsedAmount) : '--';

    return (
        <div className="new-order">
            <button type="button" className="new-order__back" onClick={() => navigate('/orders')}>
                <ArrowLeft size={15} />
                All orders
            </button>

            <header>
                <h1 className="app-page-title">Place an order</h1>
                <p className="app-page-subtitle">The tracking page opens as soon as it is saved.</p>
            </header>

            <div className="new-order__grid">
                <Card>
                    <form className="new-order__form" onSubmit={handleSubmit}>
                        {error ? <div className="auth-form__error">{error}</div> : null}

                        <div className="field">
                            <label className="field__label" htmlFor="item-input">
                                Items
                            </label>
                            <div className="new-order__item-row">
                                <input
                                    id="item-input"
                                    className="field__input"
                                    placeholder="Add an item and press enter"
                                    value={draft}
                                    onChange={(event) => setDraft(event.target.value)}
                                    onKeyDown={handleDraftKey}
                                />
                                <Button type="button" variant="secondary" onClick={addItem} aria-label="Add item">
                                    <Plus size={17} />
                                </Button>
                            </div>

                            {items.length > 0 ? (
                                <div className="new-order__chips">
                                    {items.map((item) => (
                                        <span key={item} className="chip">
                                            {item}
                                            <button
                                                type="button"
                                                className="chip__remove"
                                                onClick={() => removeItem(item)}
                                                aria-label={`Remove ${item}`}
                                            >
                                                <X size={13} />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <span className="field__hint">Nothing added yet.</span>
                            )}
                        </div>

                        <Field
                            label="Amount"
                            type="number"
                            min="1"
                            step="0.01"
                            placeholder="7499.00"
                            hint="Required, has to be greater than zero."
                            value={amount}
                            onChange={(event) => setAmount(event.target.value)}
                        />

                        <div className="new-order__submit">
                            <Button type="submit" loading={loading}>
                                Place order
                            </Button>
                            <Button type="button" variant="secondary" onClick={() => navigate('/orders')}>
                                Cancel
                            </Button>
                        </div>
                    </form>
                </Card>

                <div className="new-order__side">
                    <Card title="Summary">
                        <dl className="summary">
                            <div className="summary__row">
                                <dt>Items</dt>
                                <dd>{items.length}</dd>
                            </div>
                            <div className="summary__row">
                                <dt>Amount</dt>
                                <dd>{amountPreview}</dd>
                            </div>
                            <div className="summary__row">
                                <dt>Opening status</dt>
                                <dd>PENDING</dd>
                            </div>
                        </dl>
                    </Card>

                    <div className="next-steps">
                        <h2 className="next-steps__title">What happens next</h2>
                        <ol className="next-steps__list">
                            <li>
                                <span>1</span>Order is saved and gets its first timestamp
                            </li>
                            <li>
                                <span>2</span>An event goes out on the order_event topic
                            </li>
                            <li>
                                <span>3</span>Confirmation mail reaches your inbox
                            </li>
                        </ol>
                    </div>
                </div>
            </div>
        </div>
    );
};
