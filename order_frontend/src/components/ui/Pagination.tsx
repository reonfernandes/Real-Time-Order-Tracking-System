import { ChevronLeft, ChevronRight } from 'lucide-react';
import './pagination.css';

interface PaginationProps {
    page: number;
    totalPages: number;
    totalElements: number;
    onChange: (page: number) => void;
}

export const Pagination = ({ page, totalPages, totalElements, onChange }: PaginationProps) => {
    if (totalPages <= 1) return null;

    return (
        <div className="pagination">
            <span className="pagination__count">
                Page {page + 1} of {totalPages} &middot; {totalElements} in total
            </span>
            <div className="pagination__controls">
                <button
                    type="button"
                    className="pagination__btn"
                    onClick={() => onChange(page - 1)}
                    disabled={page === 0}
                    aria-label="Previous page"
                >
                    <ChevronLeft size={16} />
                </button>
                <button
                    type="button"
                    className="pagination__btn"
                    onClick={() => onChange(page + 1)}
                    disabled={page >= totalPages - 1}
                    aria-label="Next page"
                >
                    <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );
};
