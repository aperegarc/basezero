package com.basezero.basezero.security;

import com.basezero.basezero.enums.Rol;
import org.springframework.security.core.context.SecurityContextHolder;
import com.basezero.basezero.entity.Usuario;

import java.util.Optional;

public class EmpresaContext {

    public static Long getEmpresaId() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new RuntimeException("No hay sesión autenticada");
        }
        Object principal = auth.getPrincipal();
        if (principal instanceof Usuario u) {
            return u.getEmpresa().getId();
        }
        if (principal instanceof EmpleadoUserDetails e) {
            return e.getEmpresaId();
        }
        throw new RuntimeException("No se pudo obtener el usuario del contexto de seguridad");
    }

    public static Rol getRol() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new RuntimeException("No hay sesión autenticada");
        }
        Object principal = auth.getPrincipal();
        if (principal instanceof Usuario u) {
            return u.getRol();
        }
        if (principal instanceof EmpleadoUserDetails e) {
            return e.getRol();
        }
        throw new RuntimeException("No se pudo obtener el usuario del contexto de seguridad");
    }

    public static boolean esAdministrador() {
        return getRol() == Rol.ADMINISTRADOR;
    }

    public static boolean esGestor() {
        return getRol() == Rol.GESTOR;
    }

    public static boolean puedeVerMetadata() {
        Rol rol = getRol();
        return rol == Rol.ADMINISTRADOR || rol == Rol.GESTOR;
    }

    public static Usuario getUsuario() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new RuntimeException("No hay sesión autenticada");
        }
        Object principal = auth.getPrincipal();
        if (principal instanceof Usuario u) {
            return u;
        }
        throw new RuntimeException("No se pudo obtener el usuario del contexto de seguridad");
    }

    /** Si la sesión es de un empleado (DNI), devuelve su id; si es usuario de backoffice, vacío. */
    public static Optional<Long> getEmpleadoIdSiSesionEmpleado() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return Optional.empty();
        }
        if (auth.getPrincipal() instanceof EmpleadoUserDetails e) {
            return Optional.of(e.getEmpleadoId());
        }
        return Optional.empty();
    }
}