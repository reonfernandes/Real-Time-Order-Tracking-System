// Mirrors what the backend sends back, kept in one place so pages do not guess field names.

export type OrderStatus =
    | 'PENDING'
    | 'CONFIRMED'
    | 'PROCESSING'
    | 'PACKED'
    | 'SHIPPED'
    | 'OUT_FOR_DELIVERY'
    | 'DELIVERED'
    | 'CANCELLED'
    | 'RETURNED';

export type Role = 'USER' | 'ADMIN';

export interface OrderResponse {
    id: string;
    userId: string;
    items: string[];
    amount: number;
    status: OrderStatus;
    // status name -> when it happened
    timeStamps: Record<string, string>;
    createdOn: string;
    updateOn: string;
}

export interface UserResponse {
    id: string;
    name: string;
    email: string;
    accountEnabled: boolean;
    roles: Role[];
    createdOn: string;
    updatedOn: string;
    totalOrders: number;
}

export interface JwtResponse {
    token: string;
}

export interface SignUpRequest {
    name: string;
    email: string;
    password: string;
}

export interface SignInRequest {
    email: string;
    password: string;
}

export interface CreateOrderRequest {
    items: string[];
    amount: number;
}

// Spring Data sends more fields than this, these are the ones the ui needs.
export interface PageResponse<T> {
    content: T[];
    number: number;
    size: number;
    totalElements: number;
    totalPages: number;
    first: boolean;
    last: boolean;
    empty: boolean;
}
