package com.reon.order_backend.exception;

import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.util.HashMap;
import java.util.Map;

@ControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> globalExceptionHandler(MethodArgumentNotValidException exception) {
        Map<String, String> errors = new HashMap<>();
        exception.getBindingResult().getFieldErrors().forEach(error -> {
            errors.put(error.getField(), error.getDefaultMessage());
        });
        return new ResponseEntity<>(errors, HttpStatus.BAD_REQUEST);
    }

    // fires when a request param like page or size fails its @Min / @Max check
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<Map<String, String>> handleConstraintViolation(ConstraintViolationException exception) {
        Map<String, String> errors = new HashMap<>();
        exception.getConstraintViolations().forEach(violation ->
                errors.put(violation.getPropertyPath().toString(), violation.getMessage()));
        return new ResponseEntity<>(errors, HttpStatus.BAD_REQUEST);
    }

    // email is already taken, so it is a conflict and not a bad request
    @ExceptionHandler(EmailAlreadyExistsException.class)
    public ResponseEntity<Map<String, String>> handleEmailException(EmailAlreadyExistsException exception) {
        log.info("email exception :: {}", exception.getMessage());
        return buildError("email", exception.getMessage(), HttpStatus.CONFLICT);
    }

    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<Map<String, String>> handleUserException(UserNotFoundException exception) {
        log.info("user exception :: {}", exception.getMessage());
        return buildError("user", exception.getMessage(), HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(OrderNotFoundException.class)
    public ResponseEntity<Map<String, String>> handleOrderException(OrderNotFoundException exception) {
        log.info("order exception :: {}", exception.getMessage());
        return buildError("order", exception.getMessage(), HttpStatus.NOT_FOUND);
    }

    // order is there but its current status does not allow the change
    @ExceptionHandler(OrderNotCancellableException.class)
    public ResponseEntity<Map<String, String>> handleOrderNotCancellableException(OrderNotCancellableException exception) {
        log.info("order cancel exception :: {}", exception.getMessage());
        return buildError("order", exception.getMessage(), HttpStatus.CONFLICT);
    }

    /*
    Earlier every handler was returning a fixed line, so the caller never came to know
    what actually went wrong. Now the real message from the exception is sent back.
     */
    private ResponseEntity<Map<String, String>> buildError(String field, String message, HttpStatus status) {
        Map<String, String> error = new HashMap<>();
        error.put(field, message);
        return new ResponseEntity<>(error, status);
    }
}
