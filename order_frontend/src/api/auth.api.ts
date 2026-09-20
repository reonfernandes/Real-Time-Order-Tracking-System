import { api } from './client';
import type { JwtResponse, SignInRequest, SignUpRequest, UserResponse } from '../types';

export const signUp = async (payload: SignUpRequest): Promise<UserResponse> => {
    const { data } = await api.post<UserResponse>('/api/v1/auth/sign-up', payload);
    return data;
};

export const signIn = async (payload: SignInRequest): Promise<JwtResponse> => {
    const { data } = await api.post<JwtResponse>('/api/v1/auth/sign-in', payload);
    return data;
};

// who the backend thinks we are, including the roles the ui draws itself from
export const fetchMe = async (): Promise<UserResponse> => {
    const { data } = await api.get<UserResponse>('/api/v1/auth/me');
    return data;
};

export const signOut = async (): Promise<void> => {
    await api.post('/api/v1/auth/sign-out');
};
