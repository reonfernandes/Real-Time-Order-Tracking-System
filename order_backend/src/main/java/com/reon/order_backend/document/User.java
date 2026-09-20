package com.reon.order_backend.document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Document(collection = "users")
public class User implements UserDetails {
    @Id
    private ObjectId id;
    private String name;

    @Indexed(unique = true)
    private String email;

    private String password;

    /*
    @Builder.Default is not optional here. Without it lombok leaves these initializers
    out of the builder, so User.builder()...build() came back with roles = null and the
    first getAuthorities() call on that user blew up. Registration happened to set both
    right after building, which is the only reason this never showed up.
     */
    @Builder.Default
    private boolean accountEnabled = false;

    @Builder.Default
    private Set<Role> roles = EnumSet.of(Role.USER);

    @CreatedDate
    private LocalDateTime createdOn;
    @LastModifiedDate
    private LocalDateTime updatedOn;

    public enum Role {
        USER,
        ADMIN
    }

    /*
    Orders are not kept here anymore.
    They already live in the orders collection with a userId on them, so holding a second
    copy here was just one more place which could go out of sync.
     */

    // related to spring security
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return roles
                .stream()
                .map(role -> new SimpleGrantedAuthority("ROLE_" + role.name()))
                .collect(Collectors.toSet());
    }

    @Override
    public String getUsername() {
        return this.email;
    }

    @Override
    public boolean isEnabled() {
        return this.accountEnabled;
    }

}
