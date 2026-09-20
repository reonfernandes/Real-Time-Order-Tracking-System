import { api } from './client';
import type { PageResponse, UserResponse } from '../types';

export const fetchUsers = async (page = 0, size = 10): Promise<PageResponse<UserResponse>> => {
    const { data } = await api.get<PageResponse<UserResponse>>('/api/v1/admin/users', {
        params: { page, size },
    });
    return data;
};

export const fetchUserById = async (id: string): Promise<UserResponse> => {
    const { data } = await api.get<UserResponse>(`/api/v1/admin/id/${id}`);
    return data;
};

export const fetchUserByEmail = async (email: string): Promise<UserResponse> => {
    const { data } = await api.get<UserResponse>(`/api/v1/admin/email/${encodeURIComponent(email)}`);
    return data;
};
