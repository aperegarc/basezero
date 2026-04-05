package com.basezero.basezero.entity;

import com.basezero.basezero.enums.TipoCliente;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "clientes",
    uniqueConstraints = @UniqueConstraint(columnNames = {"empresa_id", "cif_nif"}))
@Builder
public class Cliente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nombre;

    @Column(name = "cif_nif")
    private String cifNif;


    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoCliente tipo;

    private String personaContacto;
    private String cargo;
    private String telefono;
    private String email;
    private String direccion;

    @OneToMany(mappedBy = "cliente", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Venta> ventas = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "empresa_id", nullable = false)
    private Empresa empresa;

    @Autowired
    public Cliente() {
    }

    @Autowired
    public Cliente(Long id, String nombre, String cifNif, TipoCliente tipo, String personaContacto,
                   String cargo, String telefono, String email, String direccion,
                   List<Venta> ventas, Empresa empresa) {
        this.id = id;
        this.nombre = nombre;
        this.cifNif = cifNif;
        this.tipo = tipo;
        this.personaContacto = personaContacto;
        this.cargo = cargo;
        this.telefono = telefono;
        this.email = email;
        this.direccion = direccion;
        this.ventas = ventas;
        this.empresa = empresa;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public String getCifNif() { return cifNif; }
    public void setCifNif(String cifNif) { this.cifNif = cifNif; }
    public Empresa getEmpresa() { return empresa; }
    public void setEmpresa(Empresa empresa) { this.empresa = empresa; }
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
    public List<Venta> getVentas() { return ventas; }
    public void setVentas(List<Venta> ventas) { this.ventas = ventas; }

}
