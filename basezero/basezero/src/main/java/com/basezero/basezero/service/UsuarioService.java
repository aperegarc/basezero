package com.basezero.basezero.service;

import com.basezero.basezero.dto.usuario.*;
import com.basezero.basezero.entity.Empresa;
import com.basezero.basezero.entity.Usuario;
import com.basezero.basezero.repository.EmpresaRepository;
import com.basezero.basezero.repository.UsuarioRepository;
import com.basezero.basezero.security.EmpresaContext;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final EmpresaRepository empresaRepository;
    private final PasswordEncoder passwordEncoder;

    public UsuarioService(UsuarioRepository usuarioRepository, EmpresaRepository empresaRepository,
                          PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.empresaRepository = empresaRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public List<UsuarioResponseDTO> findAll() {
        return usuarioRepository.findByEmpresaId(EmpresaContext.getEmpresaId())
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public UsuarioResponseDTO findById(Long id) {
        Usuario u = usuarioRepository.findById(id)
                .filter(usr -> usr.getEmpresa().getId().equals(EmpresaContext.getEmpresaId()))
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado: " + id));
        return toDTO(u);
    }

    @Transactional
    public UsuarioResponseDTO create(UsuarioRequestDTO dto) {
        Empresa empresa = empresaRepository.findById(EmpresaContext.getEmpresaId())
                .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));

        if (usuarioRepository.existsByEmail(dto.getEmail())) {
            throw new RuntimeException("Ya existe un usuario con ese email");
        }

        Usuario usuario = new Usuario();
        usuario.setEmail(dto.getEmail());
        usuario.setUsername(dto.getEmail()); // username = email para compatibilidad
        usuario.setPassword(passwordEncoder.encode(dto.getPassword()));
        usuario.setNombre(dto.getNombre());
        usuario.setApellidos(dto.getApellidos());
        usuario.setIniciales(dto.getIniciales() != null ? dto.getIniciales()
                : dto.getNombre().substring(0, Math.min(2, dto.getNombre().length())).toUpperCase());
        usuario.setRol(dto.getRol());
        usuario.setEmpresa(empresa);
        usuario.setActivo(true);
        return toDTO(usuarioRepository.save(usuario));
    }

    @Transactional
    public UsuarioResponseDTO update(Long id, UsuarioRequestDTO dto) {
        Usuario usuario = usuarioRepository.findById(id)
                .filter(u -> u.getEmpresa().getId().equals(EmpresaContext.getEmpresaId()))
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado: " + id));

        usuario.setNombre(dto.getNombre());
        usuario.setApellidos(dto.getApellidos());
        usuario.setIniciales(dto.getIniciales());
        usuario.setRol(dto.getRol());
        if (dto.getPassword() != null && !dto.getPassword().isBlank()) {
            usuario.setPassword(passwordEncoder.encode(dto.getPassword()));
        }
        return toDTO(usuarioRepository.save(usuario));
    }

    @Transactional
    public void delete(Long id) {
        Usuario usuario = usuarioRepository.findById(id)
                .filter(u -> u.getEmpresa().getId().equals(EmpresaContext.getEmpresaId()))
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado: " + id));
        // Soft delete: desactivar en lugar de borrar
        usuario.setActivo(false);
        usuarioRepository.save(usuario);
    }

    private UsuarioResponseDTO toDTO(Usuario u) {
        return new UsuarioResponseDTO(
                u.getId(), u.getEmail(), u.getNombre(),
                u.getApellidos(), u.getIniciales(), u.getRol(), u.getActivo()
        );
    }
}
