package com.reon.order_backend.document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

/*
One row per token that was signed out.

The id is the jti claim of that token. Signing out only cleared the cookie before, so a
copy of the token taken beforehand stayed usable for the rest of its hour. Now the auth
filter refuses anything listed here.

expireAfter is "0s", which means mongo deletes the row at the moment expiresAt says,
and expiresAt is the expiry of the token itself. Past that point the token is dead on
its own, so there is nothing left to remember and the collection stays about as big as
the number of people who signed out in the last hour.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Document(collection = "revoked_tokens")
public class RevokedToken {
    @Id
    private String id;

    @Indexed(expireAfter = "0s")
    private LocalDateTime expiresAt;
}
