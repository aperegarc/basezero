package com.basezero.basezero.dto.empleado;

import java.math.BigDecimal;
import java.time.LocalDate;

public class EmpleadoResponseDTO {

    private Long id;
    private String nombre;
    private String dni;
    private String telefono;
    private BigDecimal salarioMensual;
    private Boolean activo;
    private LocalDate fechaAlta;
    private int totalTareas;
    private int tareasCompletadas;
    private int tareasPendientes;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public String getDni() { return dni; }
    public void setDni(String dni) { this.dni = dni; }
    public String getTelefono() { return telefono; }
    public void setTelefono(String telefono) { this.telefono = telefono; }
    public BigDecimal getSalarioMensual() { return salarioMensual; }
    public void setSalarioMensual(BigDecimal salarioMensual) { this.salarioMensual = salarioMensual; }
    public Boolean getActivo() { return activo; }
    public void setActivo(Boolean activo) { this.activo = activo; }
    public LocalDate getFechaAlta() { return fechaAlta; }
    public void setFechaAlta(LocalDate fechaAlta) { this.fechaAlta = fechaAlta; }
    public int getTotalTareas() { return totalTareas; }
    public void setTotalTareas(int totalTareas) { this.totalTareas = totalTareas; }
    public int getTareasCompletadas() { return tareasCompletadas; }
    public void setTareasCompletadas(int tareasCompletadas) { this.tareasCompletadas = tareasCompletadas; }
    public int getTareasPendientes() { return tareasPendientes; }
    public void setTareasPendientes(int tareasPendientes) { this.tareasPendientes = tareasPendientes; }
}