package com.basezero.basezero.auth;

import com.basezero.basezero.entity.RefreshToken;
import com.basezero.basezero.repository.RefreshTokenRepository;
import com.basezero.basezero.repository.UsuarioRepository;
import com.basezero.basezero.security.JwtService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.*;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Arrays;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;
    private final JwtService jwtService;
    private final UsuarioRepository usuarioRepository;
    private final RefreshTokenRepository refreshTokenRepository;

    public AuthController(AuthenticationManager authenticationManager,
                          UserDetailsService userDetailsService,
                          JwtService jwtService,
                          UsuarioRepository usuarioRepository,
                          RefreshTokenRepository refreshTokenRepository) {
        this.authenticationManager = authenticationManager;
        this.userDetailsService = userDetailsService;
        this.jwtService = jwtService;
        this.usuarioRepository = usuarioRepository;
        this.refreshTokenRepository = refreshTokenRepository;
    }

    @Transactional
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
            );
        } catch (Exception e) {
            return ResponseEntity.status(403).body(Map.of("error", "Email o contraseña incorrectos"));
        }

        // findByEmailWithEmpresa hace JOIN FETCH para evitar LazyInitializationException
        // al acceder a usuario.getEmpresa() fuera de sesión JPA
        var usuario = usuarioRepository.findByEmailWithEmpresa(request.getUsername())
                .orElseThrow();
        var userDetails = usuario; // Usuario ya implementa UserDetails

        if (!usuario.getEmpresa().getActiva())
            return ResponseEntity.status(403).body(Map.of("error", "Empresa inactiva"));

        var token = jwtService.generateToken(userDetails, Map.of(
                "rol", usuario.getRol().name(),
                "empresaId", usuario.getEmpresa().getId(),
                "empresaNombre", usuario.getEmpresa().getNombre()
        ));

        return ResponseEntity.ok(new LoginResponse(
                usuario.getId(),
                token,
                usuario.getEmail(),
                usuario.getNombre(),
                usuario.getApellidos(),
                usuario.getIniciales(),
                usuario.getRol()
        ));
    }

    @PostMapping("/refresh")
    public ResponseEntity<Map<String, String>> refresh(HttpServletRequest request) {
        // Leer refresh token de la cookie HttpOnly
        String refreshTokenStr = null;
        if (request.getCookies() != null) {
            refreshTokenStr = Arrays.stream(request.getCookies())
                    .filter(c -> "refreshToken".equals(c.getName()))
                    .map(Cookie::getValue)
                    .findFirst()
                    .orElse(null);
        }

        if (refreshTokenStr == null)
            return ResponseEntity.status(401).body(Map.of("error", "No hay refresh token"));

        // Validar en BD
        RefreshToken stored = refreshTokenRepository.findByToken(refreshTokenStr).orElse(null);
        if (stored == null || stored.getRevocado() || stored.getExpiresAt().isBefore(Instant.now()))
            return ResponseEntity.status(401).body(Map.of("error", "Refresh token inválido o expirado"));

        // Generar nuevo access token con los mismos claims que el login
        String username = stored.getUsername(); // el subject del JWT es el email
        var userDetails = userDetailsService.loadUserByUsername(username);
        var usuario = usuarioRepository.findByEmailWithEmpresa(username).orElseThrow();
        String newAccessToken = jwtService.generateToken(userDetails, Map.of(
                "rol", usuario.getRol().name(),
                "empresaId", usuario.getEmpresa().getId(),
                "empresaNombre", usuario.getEmpresa().getNombre()
        ));

        return ResponseEntity.ok(Map.of("token", newAccessToken));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request, HttpServletResponse response) {
        // Revocar refresh token de BD
        if (request.getCookies() != null) {
            Arrays.stream(request.getCookies())
                    .filter(c -> "refreshToken".equals(c.getName()))
                    .findFirst()
                    .ifPresent(c -> {
                        refreshTokenRepository.findByToken(c.getValue())
                                .ifPresent(rt -> {
                                    rt.setRevocado(true);
                                    refreshTokenRepository.save(rt);
                                });
                    });
        }

        // Borrar cookie
        Cookie cookie = new Cookie("refreshToken", "");
        cookie.setHttpOnly(true);
        cookie.setPath("/api/auth/refresh");
        cookie.setMaxAge(0);
        response.addCookie(cookie);

        return ResponseEntity.ok().build();
    }

    private boolean isPasswordSecure(String password) {
        if (password == null || password.length() < 8) return false;
        boolean hasUpper = password.chars().anyMatch(Character::isUpperCase);
        boolean hasDigit = password.chars().anyMatch(Character::isDigit);
        return hasUpper && hasDigit;
    }
}