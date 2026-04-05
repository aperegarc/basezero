package com.basezero.basezero.service;

import com.basezero.basezero.dto.empresa.RegistroEmpresaDTO;
import com.basezero.basezero.entity.Empresa;
import com.basezero.basezero.entity.Usuario;
import com.basezero.basezero.enums.Rol;
import com.basezero.basezero.repository.EmpresaRepository;
import com.basezero.basezero.repository.UsuarioRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EmpresaService {

    private final EmpresaRepository empresaRepository;
    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    public EmpresaService(EmpresaRepository empresaRepository,
                          UsuarioRepository usuarioRepository,
                          PasswordEncoder passwordEncoder) {
        this.empresaRepository = empresaRepository;
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public void registrar(RegistroEmpresaDTO dto) {
        if (empresaRepository.existsByEmail(dto.getEmailEmpresa()))
            throw new RuntimeException("Ya existe una empresa con ese email");
        if (usuarioRepository.existsByEmail(dto.getEmailAdmin()))
            throw new RuntimeException("Ya existe un usuario con ese email");

        // Crear empresa
        Empresa empresa = new Empresa();
        empresa.setNombre(dto.getNombreEmpresa());
        empresa.setEmail(dto.getEmailEmpresa());
        empresa = empresaRepository.save(empresa);

        // Crear admin
        Usuario admin = new Usuario();
        admin.setEmail(dto.getEmailAdmin());
        admin.setUsername(dto.getEmailAdmin());
        admin.setNombre(dto.getNombreAdmin());
        admin.setApellidos("");
        admin.setIniciales(dto.getNombreAdmin().substring(0, Math.min(2, dto.getNombreAdmin().length())).toUpperCase());
        admin.setPassword(passwordEncoder.encode(dto.getPasswordAdmin()));
        admin.setRol(Rol.ADMINISTRADOR);
        admin.setActivo(true);
        admin.setEmpresa(empresa);
        usuarioRepository.save(admin);
    }
}