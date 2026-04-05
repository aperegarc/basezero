package com.basezero.basezero.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "empleados",
    uniqueConstraints = @UniqueConstraint(columnNames = {"empresa_id", "dni"}))
public class Empleado {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nombre;

    @Column(nullable = false)
    private String dni;

    @Column(nullable = false)
    private String password;

    private String telefono;

    @Column(precision = 10, scale = 2)
    private BigDecimal salarioMensual;

    @Column(nullable = false)
    private Boolean activo = true;

    private LocalDate fechaAlta;

    @OneToMany(mappedBy = "empleado", cascade = CascadeType.ALL)
    private List<Tarea> tareas = new ArrayList<>();

    @OneToMany(mappedBy = "empleado", cascade = CascadeType.ALL)
    private List<Turno> turnos = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "empresa_id", nullable = false)
    private Empresa empresa;

    public Empresa getEmpresa() { return empresa; }
    public void setEmpresa(Empresa empresa) { this.empresa = empresa; }
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public String getDni() { return dni; }
    public void setDni(String dni) { this.dni = dni; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getTelefono() { return telefono; }
    public void setTelefono(String telefono) { this.telefono = telefono; }
    public BigDecimal getSalarioMensual() { return salarioMensual; }
    public void setSalarioMensual(BigDecimal salarioMensual) { this.salarioMensual = salarioMensual; }
    public Boolean getActivo() { return activo; }
    public void setActivo(Boolean activo) { this.activo = activo; }
    public LocalDate getFechaAlta() { return fechaAlta; }
    public void setFechaAlta(LocalDate fechaAlta) { this.fechaAlta = fechaAlta; }
    public List<Tarea> getTareas() { return tareas; }
    public List<Turno> getTurnos() { return turnos; }
}