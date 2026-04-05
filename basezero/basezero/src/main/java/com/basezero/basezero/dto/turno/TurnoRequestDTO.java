package com.basezero.basezero.dto.turno;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.LocalTime;

public class TurnoRequestDTO {

    @NotNull
    private Long empleadoId;
    @NotNull
    private LocalDate fecha;
    @NotNull
    private LocalTime horaEntrada;
    @NotNull
    private LocalTime horaSalida;
    private String notas;

    public Long getEmpleadoId() { return empleadoId; }
    public void setEmpleadoId(Long empleadoId) { this.empleadoId = empleadoId; }
    public LocalDate getFecha() { return fecha; }
    public void setFecha(LocalDate fecha) { this.fecha = fecha; }
    public LocalTime getHoraEntrada() { return horaEntrada; }
    public void setHoraEntrada(LocalTime horaEntrada) { this.horaEntrada = horaEntrada; }
    public LocalTime getHoraSalida() { return horaSalida; }
    public void setHoraSalida(LocalTime horaSalida) { this.horaSalida = horaSalida; }
    public String getNotas() { return notas; }
    public void setNotas(String notas) { this.notas = notas; }
}