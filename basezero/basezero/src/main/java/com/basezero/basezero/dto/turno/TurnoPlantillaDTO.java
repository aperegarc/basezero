package com.basezero.basezero.dto.turno;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.List;

/**
 * Aplica una plantilla semanal de horarios a uno o varios empleados
 * a lo largo de un rango de fechas.
 *
 * Ejemplo: para empleados [1, 2] del 10/05 al 31/05:
 *   - Lunes a Viernes: 09:00 - 17:00
 *   - Sábados: 09:00 - 14:00
 */
public class TurnoPlantillaDTO {

    @NotEmpty
    private List<Long> empleadoIds;

    @NotNull
    private LocalDate fechaInicio;

    @NotNull
    private LocalDate fechaFin;

    @NotEmpty
    @Valid
    private List<HorarioDiaDTO> horarios;

    private String notas;

    /**
     * Si true, no crea un turno si ya existe uno para el empleado y fecha.
     * Si false, crea siempre (puede generar duplicados).
     */
    private boolean evitarDuplicados = true;

    /**
     * Si true, sobrescribe los turnos existentes del rango para los empleados indicados
     * antes de crear los nuevos. Útil para "reemplazar la planificación".
     */
    private boolean sobrescribir = false;

    public List<Long> getEmpleadoIds() { return empleadoIds; }
    public void setEmpleadoIds(List<Long> empleadoIds) { this.empleadoIds = empleadoIds; }
    public LocalDate getFechaInicio() { return fechaInicio; }
    public void setFechaInicio(LocalDate fechaInicio) { this.fechaInicio = fechaInicio; }
    public LocalDate getFechaFin() { return fechaFin; }
    public void setFechaFin(LocalDate fechaFin) { this.fechaFin = fechaFin; }
    public List<HorarioDiaDTO> getHorarios() { return horarios; }
    public void setHorarios(List<HorarioDiaDTO> horarios) { this.horarios = horarios; }
    public String getNotas() { return notas; }
    public void setNotas(String notas) { this.notas = notas; }
    public boolean isEvitarDuplicados() { return evitarDuplicados; }
    public void setEvitarDuplicados(boolean evitarDuplicados) { this.evitarDuplicados = evitarDuplicados; }
    public boolean isSobrescribir() { return sobrescribir; }
    public void setSobrescribir(boolean sobrescribir) { this.sobrescribir = sobrescribir; }
}
