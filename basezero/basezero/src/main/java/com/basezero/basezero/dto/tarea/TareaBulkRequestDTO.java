package com.basezero.basezero.dto.tarea;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public class TareaBulkRequestDTO {

    @NotEmpty
    @Valid
    private List<TareaRequestDTO> tareas;

    /**
     * Si true, omite tareas duplicadas (mismo empleado, cliente y fecha) en lugar de fallar.
     */
    private boolean evitarDuplicados = true;

    /**
     * Si true, sigue procesando aunque alguna tarea falle (modo tolerante).
     * Si false, hace rollback de toda la operación al primer error.
     */
    private boolean continuarSiHayErrores = true;

    public List<TareaRequestDTO> getTareas() { return tareas; }
    public void setTareas(List<TareaRequestDTO> tareas) { this.tareas = tareas; }
    public boolean isEvitarDuplicados() { return evitarDuplicados; }
    public void setEvitarDuplicados(boolean evitarDuplicados) { this.evitarDuplicados = evitarDuplicados; }
    public boolean isContinuarSiHayErrores() { return continuarSiHayErrores; }
    public void setContinuarSiHayErrores(boolean continuarSiHayErrores) { this.continuarSiHayErrores = continuarSiHayErrores; }
}
