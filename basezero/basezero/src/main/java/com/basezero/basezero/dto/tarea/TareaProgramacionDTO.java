package com.basezero.basezero.dto.tarea;

import com.basezero.basezero.enums.TipoAdjuntoTarea;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.List;

/**
 * Programa la misma tarea (cliente + zona) para uno o varios empleados,
 * en un rango de fechas, opcionalmente solo en ciertos días de la semana.
 *
 * Ejemplo: asignar la limpieza del Hotel X a los empleados 1, 2, 3
 * todos los lunes, miércoles y viernes desde el 10/05 hasta el 31/05.
 */
public class TareaProgramacionDTO {

    @NotEmpty
    private List<Long> empleadoIds;

    @NotNull
    private Long clienteId;

    @NotNull
    private String zona;

    @NotNull
    private LocalDate fechaInicio;

    @NotNull
    private LocalDate fechaFin;

    /**
     * Días de la semana en los que generar la tarea.
     * Si está vacío o null, genera la tarea para TODOS los días del rango.
     * Valores: MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY
     */
    private List<DayOfWeek> diasSemana;

    private String notas;

    /** Tipo de archivo que deberá adjuntar el empleado; por defecto VIDEO. */
    private TipoAdjuntoTarea tipoAdjunto;

    /**
     * Si true (recomendado), no crea tareas duplicadas
     * (mismo empleado + cliente + zona + fecha).
     */
    private boolean evitarDuplicados = true;

    public List<Long> getEmpleadoIds() { return empleadoIds; }
    public void setEmpleadoIds(List<Long> empleadoIds) { this.empleadoIds = empleadoIds; }
    public Long getClienteId() { return clienteId; }
    public void setClienteId(Long clienteId) { this.clienteId = clienteId; }
    public String getZona() { return zona; }
    public void setZona(String zona) { this.zona = zona; }
    public LocalDate getFechaInicio() { return fechaInicio; }
    public void setFechaInicio(LocalDate fechaInicio) { this.fechaInicio = fechaInicio; }
    public LocalDate getFechaFin() { return fechaFin; }
    public void setFechaFin(LocalDate fechaFin) { this.fechaFin = fechaFin; }
    public List<DayOfWeek> getDiasSemana() { return diasSemana; }
    public void setDiasSemana(List<DayOfWeek> diasSemana) { this.diasSemana = diasSemana; }
    public String getNotas() { return notas; }
    public void setNotas(String notas) { this.notas = notas; }
    public TipoAdjuntoTarea getTipoAdjunto() { return tipoAdjunto; }
    public void setTipoAdjunto(TipoAdjuntoTarea tipoAdjunto) { this.tipoAdjunto = tipoAdjunto; }
    public boolean isEvitarDuplicados() { return evitarDuplicados; }
    public void setEvitarDuplicados(boolean evitarDuplicados) { this.evitarDuplicados = evitarDuplicados; }
}
