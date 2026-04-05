package com.basezero.basezero.security;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collection;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    public JwtAuthFilter(JwtService jwtService, UserDetailsService userDetailsService) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        final String authHeader = request.getHeader(HttpHeaders.AUTHORIZATION);

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        final String jwt = authHeader.substring(7);

        try {
            final String username = jwtService.extractUsername(jwt);

            if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                Claims claims = jwtService.getClaims(jwt);
                String rol = (String) claims.get("rol");

                // Intenta cargar UserDetails desde la base de datos
                org.springframework.security.core.userdetails.UserDetails userDetails = null;
                try {
                    userDetails = userDetailsService.loadUserByUsername(username);
                } catch (org.springframework.security.core.userdetails.UsernameNotFoundException e) {
                    // Si no encuentra el usuario (ej: empleado), crea un UserDetails genérico
                    // basado en el JWT claims
                    Collection<org.springframework.security.core.GrantedAuthority> authorities = new ArrayList<>();
                    if (rol != null) {
                        authorities.add(new SimpleGrantedAuthority("ROLE_" + rol));
                    }
                    userDetails = new org.springframework.security.core.userdetails.User(
                            username, "", authorities
                    );
                }

                if (jwtService.isTokenValid(jwt, userDetails)) {
                    Collection<org.springframework.security.core.GrantedAuthority> authorities = new ArrayList<>(userDetails.getAuthorities());
                    
                    // Si el rol no está ya en las autoridades, lo agrega
                    if (rol != null && authorities.stream()
                            .noneMatch(a -> a.getAuthority().equals("ROLE_" + rol))) {
                        authorities.add(new SimpleGrantedAuthority("ROLE_" + rol));
                    }

                    var authToken = new UsernamePasswordAuthenticationToken(
                            userDetails, null, authorities);

                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            }
        } catch (Exception e) {
        }

        filterChain.doFilter(request, response);
    }
}