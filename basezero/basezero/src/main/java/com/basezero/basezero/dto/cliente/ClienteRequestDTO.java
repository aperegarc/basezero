package com.basezero.basezero.dto.cliente;

import com.basezero.basezero.enums.TipoCliente;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class ClienteRequestDTO {

    @NotBlank
    private String nombre;
    private String cifNif;
    @NotNull
    private TipoCliente tipo;
    private String personaContacto;
    private String cargo;
    private String telefono;
    private String email;
    private String direccion;

    public ClienteRequestDTO() {}

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public String getCifNif() { return cifNif; }
    public void setCifNif(String cifNif) { this.cifNif = cifNif; }
    public TipoCliente getTipo() { return tipo; }
    public void setTipo(TipoCliente tipo) { this.tipo = tipo; }
    public String getPersonaContacto() { return personaContacto; }
    public void setPersonaContacto(String personaContacto) { this.personaContacto = personaContacto; }
    public String getCargo() { return cargo; }
    public void setCargo(String cargo) { this.cargo = cargo; }
    public String getTelefono() { return telefono; }
    public void setTelefono(String telefono) { this.telefono = telefono; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getDireccion() { return direccion; }
    public void setDireccion(String direccion) { this.direccion = direccion; }
}