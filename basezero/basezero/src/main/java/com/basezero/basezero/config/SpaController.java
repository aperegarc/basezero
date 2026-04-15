package com.basezero.basezero.config;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

/**
 * Redirige cualquier ruta no-API al index.html para que React Router funcione.
 */
@Controller
public class SpaController {

    @RequestMapping(value = {
            "/login",
            "/registro",
            "/dashboard",
            "/clientes",
            "/ventas",
            "/cobros",
            "/contratos",
            "/empleados",
            "/tareas",
            "/turnos",
            "/usuarios",
            "/config",
            "/utilidades"
    })
    public String forward(HttpServletRequest request) {
        return "forward:/index.html";
    }
}
