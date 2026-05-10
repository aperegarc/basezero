package com.basezero.basezero.dto.turno;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.List;

/**
 * Copia los turnos existentes de una semana a otra(s).
 * Útil para replicar la planificación semanal sin tener que reconfigurarla.
 */
public class TurnoCopiarSemanaDTO {

    @NotEmpty
    private List<Long> empleadoIds;

    /**
     * Lunes (o cualquier día) de la semana a copiar.
     */
    @NotNull
    private LocalDate semanaOrigen;

    /**
     * Lunes (o cualquier día) de la primera semana destino.
     */
    @NotNull
    private LocalDate semanaDestino;

    /**
     * Cantidad de semanas a generar a partir de semanaDestino.
     * Por defecto 1 (copia única).
     */
    private int repetirSemanas = 1;

    /**
     * Si true, no copia el turno si ya existe uno para el empleado y fecha destino.
     */
    private boolean evitarDuplicados = true;

    public List<Long> getEmpleadoIds() { return empleadoIds; }
    public void setEmpleadoIds(List<Long> empleadoIds) { this.empleadoIds = empleadoIds; }
    public LocalDate getSemanaOrigen() { return semanaOrigen; }
    public void setSemanaOrigen(LocalDate semanaOrigen) { this.semanaOrigen = semanaOrigen; }
    public LocalDate getSemanaDestino() { return semanaDestino; }
    public void setSemanaDestino(LocalDate semanaDestino) { this.semanaDestino = semanaDestino; }
    public int getRepetirSemanas() { return repetirSemanas; }
    public void setRepetirSemanas(int repetirSemanas) { this.repetirSemanas = repetirSemanas; }
    public boolean isEvitarDuplicados() { return evitarDuplicados; }
    public void setEvitarDuplicados(boolean evitarDuplicados) { this.evitarDuplicados = evitarDuplicados; }
}
