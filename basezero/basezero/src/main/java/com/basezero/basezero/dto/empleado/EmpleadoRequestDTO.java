package com.basezero.basezero.dto.empleado;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;

public class EmpleadoRequestDTO {

    @NotBlank
    private String nombre;
    @NotBlank
    private String dni;
    @NotBlank
    private String password;
    private String telefono;
    private BigDecimal salarioMensual;
    private Boolean activo = true;
    private LocalDate fechaAlta;

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
}