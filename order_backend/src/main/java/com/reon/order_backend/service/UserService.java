package com.reon.order_backend.service;

import com.reon.order_backend.dto.user.UserLogin;
import com.reon.order_backend.dto.user.UserRequest;
import com.reon.order_backend.dto.user.UserResponse;
import com.reon.order_backend.jwt.JwtResponse;

public interface UserService {
    UserResponse registration(UserRequest request);
    JwtResponse authenticateUser(UserLogin login);
    UserResponse fetchCurrentUser(String email);
}
