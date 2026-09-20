import { STATUS_META, MAIN_FLOW } from '../../lib/status';
import { formatDateTime } from '../../lib/format';
import type { OrderStatus } from '../../types';
import './status-timeline.css';

interface StatusTimelineProps {
    status: OrderStatus;
    timeStamps: Record<string, string>;
}

export const StatusTimeline = ({ status, timeStamps }: StatusTimelineProps) => {
    const closedEarly = status === 'CANCELLED';
    // a cancelled order stops wherever it was, so walk the flow only till what actually happened
    const reachedIndex = closedEarly
        ? MAIN_FLOW.filter((step) => timeStamps[step]).length - 1
        : MAIN_FLOW.indexOf(status === 'RETURNED' ? 'DELIVERED' : status);

    const steps = MAIN_FLOW.map((step, index) => ({
        step,
        meta: STATUS_META[step],
        done: index < reachedIndex,
        current: index === reachedIndex && !closedEarly,
        stamp: timeStamps[step],
    }));

    return (
        <ol className="timeline">
            {steps.map(({ step, meta, done, current, stamp }) => (
                <li
                    key={step}
                    className={`timeline__item ${done ? 'timeline__item--done' : ''} ${current ? 'timeline__item--current' : ''}`}
                >
                    <div className="timeline__rail">
                        <span className="timeline__dot" />
                        <span className="timeline__line" />
                    </div>
                    <div className="timeline__body">
                        <div className="timeline__text">
                            <span className="timeline__label">{meta.label}</span>
                            <span className="timeline__note">{meta.note}</span>
                        </div>
                        <span className="timeline__time app-mono">{stamp ? formatDateTime(stamp) : '--'}</span>
                    </div>
                </li>
            ))}

            {closedEarly || status === 'RETURNED' ? (
                <li className="timeline__item timeline__item--closed">
                    <div className="timeline__rail">
                        <span className="timeline__dot" style={{ background: STATUS_META[status].ink, borderColor: STATUS_META[status].ink }} />
                    </div>
                    <div className="timeline__body">
                        <div className="timeline__text">
                            <span className="timeline__label">{STATUS_META[status].label}</span>
                            <span className="timeline__note">{STATUS_META[status].note}</span>
                        </div>
                        <span className="timeline__time app-mono">{formatDateTime(timeStamps[status])}</span>
                    </div>
                </li>
            ) : null}
        </ol>
    );
};
