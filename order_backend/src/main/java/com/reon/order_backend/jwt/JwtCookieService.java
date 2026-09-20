package com.reon.order_backend.jwt;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/*
The jwt cookie used to be built by hand in three places (login, logout and the auth
filter) and they had already started to drift apart. One place now.

The secure flag comes from config instead of being hardcoded. It has to stay on for a
real deployment, but a browser silently drops a Secure cookie when the page is served
over plain http, and localhost is the only http origin browsers make an exception for.
So anything like a staging box on http needs to be able to turn it off, otherwise the
cookie never gets stored and the sse stream, which has no other way to authenticate,
never connects.
 */
@Component
public class JwtCookieService {

    public static final String COOKIE_NAME = "JWT";

    @Value("${app.cookie.secure}")
    private boolean secure;

    @Value("${app.cookie.same-site}")
    private String sameSite;

    @Value("${jwt.expiration-time}")
    private long tokenExpirationTime;

    public void write(HttpServletResponse response, String token) {
        response.addCookie(build(token, (int) (tokenExpirationTime / 1000)));
    }

    // maxAge 0 tells the browser to drop it right away
    public void clear(HttpServletResponse response) {
        response.addCookie(build(null, 0));
    }

    private Cookie build(String token, int maxAge) {
        Cookie cookie = new Cookie(COOKIE_NAME, token);
        cookie.setPath("/");
        // httpOnly keeps the token away from javascript, so XSS cannot read it
        cookie.setHttpOnly(true);
        cookie.setSecure(secure);
        cookie.setMaxAge(maxAge);
        cookie.setAttribute("SameSite", sameSite);
        return cookie;
    }
}
