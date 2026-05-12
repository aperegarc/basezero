package com.basezero.basezero.bootstrap;

import com.basezero.basezero.entity.Empresa;
import com.basezero.basezero.entity.Usuario;
import com.basezero.basezero.enums.Rol;
import com.basezero.basezero.repository.EmpresaRepository;
import com.basezero.basezero.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Crea empresa + administrador de desarrollo si no existen (idempotente).
 * Desactivar en producción con {@code app.seed.dev-admin.enabled=false}.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DevDataSeedService {

    private static final String SEED_EMPRESA_EMAIL = "seed-empresa@basezero.local";

    private final EmpresaRepository empresaRepository;
    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.seed.dev-admin.enabled:true}")
    private boolean seedEnabled;

    @Value("${app.seed.dev-admin.email:admin}")
    private String adminEmail;

    @Value("${app.seed.dev-admin.password:admin123}")
    private String adminPassword;

    @Transactional
    public void seedIfNeeded() {
        if (!seedEnabled) {
            return;
        }
        if (usuarioRepository.existsByEmail(adminEmail)) {
            return;
        }

        Empresa empresa = empresaRepository.findByEmail(SEED_EMPRESA_EMAIL).orElseGet(() -> {
            Empresa e = new Empresa();
            e.setNombre("Empresa desarrollo (seed)");
            e.setEmail(SEED_EMPRESA_EMAIL);
            e.setActiva(true);
            return empresaRepository.save(e);
        });

        Usuario admin = new Usuario();
        admin.setEmail(adminEmail);
        admin.setUsername(adminEmail);
        admin.setPassword(passwordEncoder.encode(adminPassword));
        admin.setNombre("Admin");
        admin.setApellidos("Desarrollo");
        admin.setIniciales("AD");
        admin.setRol(Rol.ADMINISTRADOR);
        admin.setActivo(true);
        admin.setEmpresa(empresa);
        usuarioRepository.save(admin);
        log.info("Datos de desarrollo: usuario administrador creado (email={})", adminEmail);
    }
}
