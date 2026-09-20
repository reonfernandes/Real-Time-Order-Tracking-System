package com.reon.order_backend.jwt;

import com.reon.order_backend.service.impl.CustomUserDetailService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private final JwtUtils jwtUtils;
    private final CustomUserDetailService customUserDetailService;
    private final TokenRevocationService tokenRevocationService;
    private final JwtCookieService jwtCookieService;

    public JwtAuthenticationFilter(JwtUtils jwtUtils, CustomUserDetailService customUserDetailService,
                                   TokenRevocationService tokenRevocationService, JwtCookieService jwtCookieService) {
        this.jwtUtils = jwtUtils;
        this.customUserDetailService = customUserDetailService;
        this.tokenRevocationService = tokenRevocationService;
        this.jwtCookieService = jwtCookieService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        try {
            String jwt = jwtUtils.getJwtFromHeader(request);
            if (jwt != null && jwtUtils.validateToken(jwt)) {

                /*
                The signature is fine but this token was signed out. Clear the stale cookie
                and simply do not authenticate: the request carries on unauthenticated, so
                the open endpoints still answer and the guarded ones fall through to the
                entry point for a normal 401.
                 */
                if (tokenRevocationService.isRevoked(jwt)) {
                    log.info("Rejected a token which was already signed out");
                    jwtCookieService.clear(response);
                    filterChain.doFilter(request, response);
                    return;
                }

                String username = jwtUtils.getUsernameFromToken(jwt);

                UserDetails userDetails = customUserDetailService.loadUserByUsername(username);
                if (username.equals(userDetails.getUsername())) {
                    UsernamePasswordAuthenticationToken authentication = new
                            UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                    log.info("Authenticated User: {} with role: {}", username, userDetails.getAuthorities());
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                }
            }
        } catch (Exception exception) {
            log.warn("JWT as expired or invalid: {}", exception.getMessage());
            jwtCookieService.clear(response);
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            return;
        }
        filterChain.doFilter(request, response);
    }
}
