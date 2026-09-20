package com.reon.order_backend.jwt;

import com.reon.order_backend.document.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.security.Key;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Date;
import java.util.UUID;

@Component
@Slf4j
public class JwtUtils {
    @Value("${jwt.secret-key}")
    private String jwtSecret;

    @Value("${jwt.expiration-time}")
    private Long expirationTime;

    public String getJwtFromHeader(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }
        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if (cookie.getName().equals(JwtCookieService.COOKIE_NAME)) {
                    return cookie.getValue();
                }
            }
        }
        return null;
    }

    /*
    Roles are not put inside the token on purpose.
    The filter loads the user from db on every request, so the roles are always the latest ones.
    If they were kept in the token, a role change would only apply after the user logs in again.

    The jti is a random id for this one token. Signing out writes it to the revoked list,
    which is what lets us turn a single token off without touching the others the same
    user may have open in another browser.
     */
    public String generateToken(User user) {
        Date issuedAt = new Date();
        return Jwts.builder()
                .id(UUID.randomUUID().toString())
                .subject(user.getEmail())
                .issuedAt(issuedAt)
                .expiration(new Date(issuedAt.getTime() + expirationTime))
                .signWith(key())
                .compact();
    }

    private Key key() {
        return Keys.hmacShaKeyFor(Decoders.BASE64URL.decode(jwtSecret));
    }

    public String getUsernameFromToken(String token) {
        return claims(token).getSubject();
    }

    // null for a token we cannot read, and for the older tokens which were signed without a jti
    public String getTokenId(String token) {
        try {
            return claims(token).getId();
        } catch (JwtException | IllegalArgumentException exception) {
            return null;
        }
    }

    /*
    When this token dies on its own. The revoked list uses it as the point where the
    entry can be thrown away, since a token past its expiry is refused anyway.
     */
    public LocalDateTime getExpiry(String token) {
        Date expiration = claims(token).getExpiration();
        return LocalDateTime.ofInstant(
                expiration == null ? Instant.now() : expiration.toInstant(), ZoneId.systemDefault());
    }

    private Claims claims(String token) {
        return Jwts.parser()
                .verifyWith((SecretKey) key())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public boolean validateToken(String token) {
        try {
            claims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        } catch (Exception e) {
            return false;
        }
    }
}
