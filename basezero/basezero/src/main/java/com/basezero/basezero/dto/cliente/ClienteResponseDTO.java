package com.basezero.basezero.dto.cliente;

import com.basezero.basezero.enums.TipoCliente;

public class ClienteResponseDTO {

    private Long id;
    private String nombre;
    private String cifNif;
    private TipoCliente tipo;
    private String personaContacto;
    private String cargo;
    private String telefono;
    private String email;
    private String direccion;

    public ClienteResponseDTO() {}

    public ClienteResponseDTO(Long id, String nombre, String cifNif, TipoCliente tipo,
                              String personaContacto, String cargo, String telefono,
                              String email, String direccion) {
        this.id = id;
        this.nombre = nombre;
        this.cifNif = cifNif;
        this.tipo = tipo;
        this.personaContacto = personaContacto;
        this.cargo = cargo;
        this.telefono = telefono;
        this.email = email;
        this.direccion = direccion;
    }

    public Long getId() { return id; }
    public String getNombre() { return nombre; }
    public String getCifNif() { return cifNif; }
    public TipoCliente getTipo() { return tipo; }
    public String getPersonaContacto() { return personaContacto; }
    public String getCargo() { return cargo; }
    public String getTelefono() { return telefono; }
    public String getEmail() { return email; }
    public String getDireccion() { return direccion; }
}