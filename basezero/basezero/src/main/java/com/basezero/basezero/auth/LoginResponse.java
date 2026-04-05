package com.basezero.basezero.auth;

import com.basezero.basezero.enums.Rol;

public class LoginResponse {
    private Long id;
    private String token;
    private String email;
    private String nombre;
    private String apellidos;
    private String iniciales;
    private String rol;

    public LoginResponse() {}

    public LoginResponse(Long id, String token, String email, String nombre,
                         String apellidos, String iniciales, Rol rol) {
        this.id = id;
        this.token = token;
        this.email = email;
        this.nombre = nombre;
        this.apellidos = apellidos;
        this.iniciales = iniciales;
        this.rol = rol.name();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getApellidos() { return apellidos; }
    public void setApellidos(String apellidos) { this.apellidos = apellidos; }

    public String getIniciales() { return iniciales; }
    public void setIniciales(String iniciales) { this.iniciales = iniciales; }

    public String getRol() { return rol; }
    public void setRol(Rol rol) { this.rol = rol.name(); }
}