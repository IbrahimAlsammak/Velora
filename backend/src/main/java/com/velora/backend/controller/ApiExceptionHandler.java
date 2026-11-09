package com.velora.backend.controller;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

/**
 * Turns errors into simple, friendly JSON the website can show, e.g.
 *   { "message": "Only 2 left of Linen Maxi Dress." }
 *   { "message": "Please check the form.", "fields": { "email": "Please enter a valid email" } }
 */
@RestControllerAdvice
public class ApiExceptionHandler {

    /** A form rule (@NotBlank, @Email...) failed. */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> invalidForm(MethodArgumentNotValidException ex) {
        Map<String, String> fields = new LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors()
                .forEach(e -> fields.putIfAbsent(e.getField(), e.getDefaultMessage()));
        return ResponseEntity.badRequest().body(Map.of("message", "Please check the form.", "fields", fields));
    }

    /** Errors we throw on purpose, like "sold out" or "not found". */
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> statusError(ResponseStatusException ex) {
        String message = ex.getReason() != null ? ex.getReason() : "Something went wrong.";
        return ResponseEntity.status(ex.getStatusCode()).body(Map.of("message", message));
    }

    /** Photo bigger than the limit in application.properties. */
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<Map<String, Object>> tooBig(MaxUploadSizeExceededException ex) {
        return ResponseEntity.status(HttpStatus.CONTENT_TOO_LARGE)
                .body(Map.of("message", "That photo is too big. Please use one under 5 MB."));
    }

    /** The request body wasn't valid JSON. */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, Object>> unreadable(HttpMessageNotReadableException ex) {
        return ResponseEntity.badRequest().body(Map.of("message", "Invalid request."));
    }
}
