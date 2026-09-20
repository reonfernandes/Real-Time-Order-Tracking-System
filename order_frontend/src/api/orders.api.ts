import { api } from './client';
import type { CreateOrderRequest, OrderResponse, OrderStatus, PageResponse } from '../types';

export const createOrder = async (payload: CreateOrderRequest): Promise<OrderResponse> => {
    const { data } = await api.post<OrderResponse>('/api/v1/order/generateOrder', payload);
    return data;
};

export const fetchOrders = async (page = 0, size = 10): Promise<PageResponse<OrderResponse>> => {
    const { data } = await api.get<PageResponse<OrderResponse>>('/api/v1/order/orders', {
        params: { page, size },
    });
    return data;
};

export const fetchOrderById = async (orderId: string): Promise<OrderResponse> => {
    const { data } = await api.get<OrderResponse>(`/api/v1/order/fetch/${orderId}`);
    return data;
};

export const updateOrderStatus = async (orderId: string, status: OrderStatus): Promise<OrderResponse> => {
    const { data } = await api.put<OrderResponse>(`/api/v1/order/update/${orderId}`, { status });
    return data;
};

export const cancelOrder = async (orderId: string): Promise<void> => {
    await api.delete(`/api/v1/order/cancel/${orderId}`);
};
