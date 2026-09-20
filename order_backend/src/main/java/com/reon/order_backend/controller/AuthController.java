package com.reon.order_backend.controller;

import com.reon.order_backend.dto.user.UserLogin;
import com.reon.order_backend.dto.user.UserRequest;
import com.reon.order_backend.dto.user.UserResponse;
import com.reon.order_backend.jwt.JwtCookieService;
import com.reon.order_backend.jwt.JwtResponse;
import com.reon.order_backend.jwt.JwtUtils;
import com.reon.order_backend.jwt.TokenRevocationService;
import com.reon.order_backend.service.UserService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;

import lombok.extern.slf4j.Slf4j;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping(
        name = "endpoints related to user operations.",
        path = "/api/v1/auth"
)
@Slf4j
@Tag(
        name = "Auth APIs",
        description = "These endpoints are related to basic user operations like Registration, Sign In and Logout"
)
public class AuthController {
    private final UserService userService;
    private final JwtCookieService jwtCookieService;
    private final JwtUtils jwtUtils;
    private final TokenRevocationService tokenRevocationService;

    public AuthController(UserService userService, JwtCookieService jwtCookieService, JwtUtils jwtUtils,
                          TokenRevocationService tokenRevocationService) {
        this.userService = userService;
        this.jwtCookieService = jwtCookieService;
        this.jwtUtils = jwtUtils;
        this.tokenRevocationService = tokenRevocationService;
    }

    @PostMapping(
            name = "endpoint for registering new user",
            path = "/sign-up"
    )
    @Operation(
            summary = "Register a new User",
            description = "This endpoint allows a new user to register by providing a valid name, email, and password."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "User registered successful",
                    content = {@Content(schema = @Schema(implementation = UserResponse.class))})
    })
    public ResponseEntity<UserResponse> userRegistration(@Valid @RequestBody UserRequest dto) {
        log.info("Auth Controller :: Incoming request for registration: {}", dto.getEmail());
        UserResponse response =  userService.registration(dto);
        log.info("Auth Controller :: User Registration successful.");
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping(
            name = "endpoint for authenticating user",
            path = "/sign-in"
    )
    @Operation(
            summary = "User Login",
            description = "This endpoint allows user to login by providing valid email and password."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Login successful. JWT is set in cookie.",
            content = {@Content(schema = @Schema(implementation = JwtResponse.class))})
    })
    public ResponseEntity<JwtResponse> userAuthentication(@Valid @RequestBody UserLogin login,
                                                          HttpServletResponse response) {
        log.info("Auth Controller :: Incoming login request: {}", login.getEmail());
        JwtResponse jwtResponse = userService.authenticateUser(login);

        jwtCookieService.write(response, jwtResponse.getToken());

        // token itself is never logged, printing it is as good as leaking the password
        log.info("Auth Controller :: Authentication successful for: {}", login.getEmail());
        return ResponseEntity
                .status(HttpStatus.OK)
                .body(jwtResponse);
    }

    /*
    Who am I. The frontend needs the name and the roles to draw itself, and it used to
    work that out by calling an admin only endpoint and watching whether it came back
    403, which left a failed request in the logs on every normal login and put the admin
    flag in localStorage where the user could edit it. This answers the question directly.
     */
    @GetMapping(
            name = "endpoint for the currently signed in user",
            path = "/me"
    )
    @Operation(
            summary = "Current user",
            description = "Returns the profile of whoever the request is authenticated as."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Profile of the signed in user",
                    content = {@Content(schema = @Schema(implementation = UserResponse.class))})
    })
    public ResponseEntity<UserResponse> currentUser(Principal principal) {
        log.info("Auth Controller :: Profile request for: {}", principal.getName());
        return ResponseEntity.ok(userService.fetchCurrentUser(principal.getName()));
    }

    @PostMapping(
            name = "endpoint for logging out",
            path = "/sign-out"
    )
    @Operation(
            summary = "User logout",
            description = "This endpoint allows already loggedIn user to logout."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Logout successful.")
    })
    public ResponseEntity<Void> logout(HttpServletRequest request, HttpServletResponse response) {
        log.info("Auth Controller :: Incoming request for logging out.");

        // clearing the cookie is not enough, a copy of the token would keep working
        tokenRevocationService.revoke(jwtUtils.getJwtFromHeader(request));
        jwtCookieService.clear(response);

        log.info("Auth Controller :: Logout successful.");
        return ResponseEntity
                .status(HttpStatus.OK)
                .build();
    }
}
