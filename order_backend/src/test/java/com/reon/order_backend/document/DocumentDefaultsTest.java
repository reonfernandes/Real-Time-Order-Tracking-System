package com.reon.order_backend.document;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/*
Plain junit, no spring context, so this runs without mongo or kafka.

Lombok leaves a field initializer out of the generated builder unless the field carries
@Builder.Default, and the failure is silent: the object simply comes back with a null
where the initializer should have been. That is what made User.builder() produce a user
with no roles, which then threw inside getAuthorities(). These assertions fail the build
if the annotations are ever dropped again.
 */
class DocumentDefaultsTest {

    @Test
    void userBuilderKeepsTheDefaultRole() {
        User user = User.builder().email("someone@example.com").build();

        assertNotNull(user.getRoles(), "roles must not be null, getAuthorities() would throw");
        assertEquals(1, user.getRoles().size());
        assertTrue(user.getRoles().contains(User.Role.USER));
    }

    @Test
    void userBuilderLeavesTheAccountDisabled() {
        // registration switches this on, nothing else should
        assertFalse(User.builder().email("someone@example.com").build().isAccountEnabled());
    }

    @Test
    void userAuthoritiesAreBuiltFromTheDefaultRole() {
        User user = User.builder().email("someone@example.com").build();

        assertEquals(1, user.getAuthorities().size());
        assertEquals("ROLE_USER", user.getAuthorities().iterator().next().getAuthority());
    }

    @Test
    void orderBuilderGivesEmptyCollectionsNotNulls() {
        Order order = Order.builder().amount(10.0).build();

        assertNotNull(order.getItems(), "items must not be null");
        assertNotNull(order.getTimeStamps(), "timeStamps must not be null, the timeline reads it");
        assertTrue(order.getItems().isEmpty());
        assertTrue(order.getTimeStamps().isEmpty());
    }
}
