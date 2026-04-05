package com.basezero.basezero.dto.usuario;

import com.basezero.basezero.enums.Rol;

public class UsuarioResponseDTO {

    private Long id;
    private String email;
    private String nombre;
    private String apellidos;
    private String iniciales;
    private Rol rol;
    private Boolean activo;

    public UsuarioResponseDTO() {}

    public UsuarioResponseDTO(Long id, String email, String nombre, String apellidos,
                              String iniciales, Rol rol, Boolean activo) {
        this.id = id;
        this.email = email;
        this.nombre = nombre;
        this.apellidos = apellidos;
        this.iniciales = iniciales;
        this.rol = rol;
        this.activo = activo;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public String getApellidos() { return apellidos; }
    public void setApellidos(String apellidos) { this.apellidos = apellidos; }
    public String getIniciales() { return iniciales; }
    public void setIniciales(String iniciales) { this.iniciales = iniciales; }
    public Rol getRol() { return rol; }
    public void setRol(Rol rol) { this.rol = rol; }
    public Boolean getActivo() { return activo; }
    public void setActivo(Boolean activo) { this.activo = activo; }
}
