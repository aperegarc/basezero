package com.basezero.basezero.security;

import com.basezero.basezero.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UsuarioRepository usuarioRepository;

    @Autowired
    public UserDetailsServiceImpl(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // Usuario.getUsername() devuelve el email, y el subject del JWT es el email.
        // Usamos findByEmailWithEmpresa para cargar también la empresa en la misma query
        // y evitar LazyInitializationException cuando EmpresaContext.getEmpresaId() se llama
        // desde el SecurityContextHolder (fuera de sesión JPA).
        return usuarioRepository.findByEmailWithEmpresa(username)
                .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado: " + username));
    }
}