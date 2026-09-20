package com.reon.order_backend.config;

import com.fasterxml.jackson.databind.module.SimpleModule;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import org.bson.types.ObjectId;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/*
By default jackson does not know what an ObjectId is, so it was going out as
{"timestamp": .., "date": ..} which is of no use to the client.
Sending it as the plain hex string instead, same value that goes in the url.
 */
@Configuration
public class JacksonConfig {

    @Bean
    public SimpleModule objectIdModule() {
        SimpleModule module = new SimpleModule();
        module.addSerializer(ObjectId.class, ToStringSerializer.instance);
        return module;
    }
}
