package com.basezero.basezero.auth;

import com.basezero.basezero.entity.Empleado;
import com.basezero.basezero.repository.EmpleadoRepository;
import com.basezero.basezero.security.JwtService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/empleados/auth")
public class EmpleadoAuthController {

    private final EmpleadoRepository empleadoRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public EmpleadoAuthController(EmpleadoRepository empleadoRepository,
                                  PasswordEncoder passwordEncoder,
                                  JwtService jwtService) {
        this.empleadoRepository = empleadoRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String dni = body.get("dni").toUpperCase();
        String password = body.get("password");

        Empleado empleado = empleadoRepository.findByDni(dni)
                .orElseThrow(() -> new RuntimeException("DNI o contraseña incorrectos"));

        if (!empleado.getActivo())
            return ResponseEntity.status(403).body(Map.of("error", "Empleado inactivo"));

        if (!passwordEncoder.matches(password, empleado.getPassword()))
            return ResponseEntity.status(401).body(Map.of("error", "DNI o contraseña incorrectos"));

        // Creamos un UserDetails temporal para generar el token
        org.springframework.security.core.userdetails.User userDetails =
                new org.springframework.security.core.userdetails.User(
                        empleado.getDni(),
                        empleado.getPassword(),
                        java.util.List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_EMPLEADO"))
                );

        String token = jwtService.generateToken(userDetails, Map.of("rol", "EMPLEADO", "empleadoId", empleado.getId()));

        return ResponseEntity.ok(Map.of(
                "token", token,
                "empleadoId", empleado.getId(),
                "nombre", empleado.getNombre(),
                "dni", empleado.getDni(),
                "rol", "EMPLEADO"
        ));
    }
}