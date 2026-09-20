package com.reon.order_backend.jwt;

import com.reon.order_backend.document.RevokedToken;
import com.reon.order_backend.repository.RevokedTokenRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/*
Signing out used to only clear the cookie, which does nothing to the token itself. Anybody
who had already copied it kept full access until it expired on its own. Now a sign out
writes the token down as revoked and the auth filter checks that list.

Tokens issued before the jti claim existed cannot be revoked, there is nothing to key
them on. They stop working when they expire, so this sorts itself out within an hour of
deploying.
 */
@Service
@Slf4j
public class TokenRevocationService {

    private final RevokedTokenRepository revokedTokenRepository;
    private final JwtUtils jwtUtils;

    public TokenRevocationService(RevokedTokenRepository revokedTokenRepository, JwtUtils jwtUtils) {
        this.revokedTokenRepository = revokedTokenRepository;
        this.jwtUtils = jwtUtils;
    }

    public void revoke(String token) {
        if (token == null || !jwtUtils.validateToken(token)) {
            // an expired or forged token is already useless, nothing to remember
            return;
        }

        String tokenId = jwtUtils.getTokenId(token);
        if (tokenId == null) {
            return;
        }

        revokedTokenRepository.save(RevokedToken.builder()
                .id(tokenId)
                .expiresAt(jwtUtils.getExpiry(token))
                .build());
        log.info("Token Revocation :: token {} is no longer usable", tokenId);
    }

    public boolean isRevoked(String token) {
        String tokenId = jwtUtils.getTokenId(token);
        return tokenId != null && revokedTokenRepository.existsById(tokenId);
    }
}
