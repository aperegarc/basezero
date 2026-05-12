package com.basezero.basezero.security;

import com.basezero.basezero.enums.Rol;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

/**
 * Principal para sesiones JWT de la tabla {@code empleados} (login por DNI).
 * Permite resolver {@link EmpresaContext#getEmpresaId()} sin cargar un {@link com.basezero.basezero.entity.Usuario}.
 */
public class EmpleadoUserDetails implements UserDetails {

    private final String dni;
    private final String passwordHash;
    private final Long empresaId;
    private final Long empleadoId;

    public EmpleadoUserDetails(String dni, String passwordHash, Long empresaId, Long empleadoId) {
        this.dni = dni;
        this.passwordHash = passwordHash;
        this.empresaId = empresaId;
        this.empleadoId = empleadoId;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_EMPLEADO"));
    }

    @Override
    public String getPassword() {
        return passwordHash;
    }

    @Override
    public String getUsername() {
        return dni;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }

    public Long getEmpresaId() {
        return empresaId;
    }

    public Long getEmpleadoId() {
        return empleadoId;
    }

    public Rol getRol() {
        return Rol.EMPLEADO;
    }
}
