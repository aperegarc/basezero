package com.basezero.basezero.dto.turno;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public class TurnoBulkRequestDTO {

    @NotEmpty
    @Valid
    private List<TurnoRequestDTO> turnos;

    /**
     * Si true, omite turnos duplicados (mismo empleado y fecha) en lugar de crearlos.
     */
    private boolean evitarDuplicados = true;

    /**
     * Si true, sigue procesando aunque alguno falle.
     * Si false, hace rollback al primer error.
     */
    private boolean continuarSiHayErrores = true;

    public List<TurnoRequestDTO> getTurnos() { return turnos; }
    public void setTurnos(List<TurnoRequestDTO> turnos) { this.turnos = turnos; }
    public boolean isEvitarDuplicados() { return evitarDuplicados; }
    public void setEvitarDuplicados(boolean evitarDuplicados) { this.evitarDuplicados = evitarDuplicados; }
    public boolean isContinuarSiHayErrores() { return continuarSiHayErrores; }
    public void setContinuarSiHayErrores(boolean continuarSiHayErrores) { this.continuarSiHayErrores = continuarSiHayErrores; }
}
