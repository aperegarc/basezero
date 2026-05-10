package com.basezero.basezero.exception;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> handleRuntime(RuntimeException ex) {
        return buildResponse(HttpStatus.BAD_REQUEST,
                ex.getMessage() != null ? ex.getMessage() : "Operación no permitida");
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> errores = new HashMap<>();
        for (FieldError fe : ex.getBindingResult().getFieldErrors()) {
            errores.put(fe.getField(), fe.getDefaultMessage());
        }
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now().toString());
        body.put("status", HttpStatus.BAD_REQUEST.value());
        body.put("error", "Datos inválidos");
        body.put("campos", errores);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    /** JSON malformado, fecha mal escrita, enum inexistente (ej: "CHEQUE"), etc. */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, Object>> handleNotReadable(HttpMessageNotReadableException ex) {
        Throwable cause = ex.getCause();
        String detalle = cause != null && cause.getMessage() != null ? cause.getMessage() : "";
        if (detalle.contains("not one of the values accepted for Enum")) {
            return buildResponse(HttpStatus.BAD_REQUEST,
                    "Valor no permitido para uno de los campos (revisa estado, tipo o método de pago)");
        }
        if (detalle.contains("LocalDate") || detalle.contains("LocalDateTime")) {
            return buildResponse(HttpStatus.BAD_REQUEST, "Formato de fecha inválido");
        }
        return buildResponse(HttpStatus.BAD_REQUEST, "El cuerpo de la petición es inválido");
    }

    /** Choques con constraints únicos, FK rotas, NOT NULL, etc. */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> handleIntegrity(DataIntegrityViolationException ex) {
        String msg = ex.getMostSpecificCause() != null
                ? ex.getMostSpecificCause().getMessage() : ex.getMessage();
        String human;
        if (msg != null && msg.toLowerCase().contains("unique")) {
            human = "Ya existe un registro con esos datos (clave duplicada)";
        } else if (msg != null && msg.toLowerCase().contains("not null")) {
            human = "Falta un campo obligatorio";
        } else if (msg != null && msg.toLowerCase().contains("foreign key")) {
            human = "Referencia inválida a otro registro";
        } else {
            human = "Conflicto de datos al guardar";
        }
        return buildResponse(HttpStatus.CONFLICT, human);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleAccessDenied(AccessDeniedException ex) {
        return buildResponse(HttpStatus.FORBIDDEN, "No tienes permisos para realizar esta acción");
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<Map<String, Object>> handleAuth(AuthenticationException ex) {
        return buildResponse(HttpStatus.UNAUTHORIZED, "Sesión inválida o expirada");
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneric(Exception ex) {
        return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, "Error interno del servidor");
    }

    private ResponseEntity<Map<String, Object>> buildResponse(HttpStatus status, String mensaje) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now().toString());
        body.put("status", status.value());
        body.put("error", mensaje);
        return ResponseEntity.status(status).body(body);
    }
}
