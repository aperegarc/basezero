package com.basezero.basezero.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Component
public class RateLimitFilter extends OncePerRequestFilter {

    // IP -> intentos fallidos
    private final ConcurrentHashMap<String, AtomicInteger> intentos = new ConcurrentHashMap<>();
    // IP -> bloqueada hasta
    private final ConcurrentHashMap<String, Instant> bloqueados = new ConcurrentHashMap<>();

    private static final int MAX_INTENTOS = 5;
    private static final int BLOQUEO_MINUTOS = 15;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        if (!request.getRequestURI().contains("/api/auth/login")) {
            filterChain.doFilter(request, response);
            return;
        }

        String ip = getClientIp(request);
        Instant bloqueadoHasta = bloqueados.get(ip);

        if (bloqueadoHasta != null && Instant.now().isBefore(bloqueadoHasta)) {
            response.setStatus(429);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"Demasiados intentos. Espera " + BLOQUEO_MINUTOS + " minutos.\"}");
            return;
        }

        // Wrapper para detectar 401
        StatusCapturingResponseWrapper wrapper = new StatusCapturingResponseWrapper(response);
        filterChain.doFilter(request, wrapper);

        if (wrapper.getStatus() == 401) {
            AtomicInteger count = intentos.computeIfAbsent(ip, k -> new AtomicInteger(0));
            int total = count.incrementAndGet();
            if (total >= MAX_INTENTOS) {
                bloqueados.put(ip, Instant.now().plusSeconds(60L * BLOQUEO_MINUTOS));
                intentos.remove(ip);
            }
        } else if (wrapper.getStatus() == 200) {
            intentos.remove(ip);
            bloqueados.remove(ip);
        }
    }

    private String getClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        return forwarded != null ? forwarded.split(",")[0].trim() : request.getRemoteAddr();
    }
}