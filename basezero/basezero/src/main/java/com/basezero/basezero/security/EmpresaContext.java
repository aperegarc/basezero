package com.basezero.basezero.security;

import com.basezero.basezero.enums.Rol;
import org.springframework.security.core.context.SecurityContextHolder;
import com.basezero.basezero.entity.Usuario;

public class EmpresaContext {

    public static Long getEmpresaId() {
        return getUsuario().getEmpresa().getId();
    }

    public static Rol getRol() {
        return getUsuario().getRol();
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
}