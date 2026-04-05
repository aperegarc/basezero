package com.basezero.basezero.dto.tarea;

import com.basezero.basezero.enums.EstadoTarea;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public class TareaRequestDTO {

    @NotNull
    private Long empleadoId;
    @NotNull
    private Long clienteId;
    @NotNull
    private String zona;
    @NotNull
    private LocalDate fecha;
    private EstadoTarea estado;
    private String notas;
    private String comentarioGestor;

    public Long getEmpleadoId() { return empleadoId; }
    public void setEmpleadoId(Long empleadoId) { this.empleadoId = empleadoId; }
    public Long getClienteId() { return clienteId; }
    public void setClienteId(Long clienteId) { this.clienteId = clienteId; }
    public String getZona() { return zona; }
    public void setZona(String zona) { this.zona = zona; }
    public LocalDate getFecha() { return fecha; }
    public void setFecha(LocalDate fecha) { this.fecha = fecha; }
    public EstadoTarea getEstado() { return estado; }
    public void setEstado(EstadoTarea estado) { this.estado = estado; }
    public String getNotas() { return notas; }
    public void setNotas(String notas) { this.notas = notas; }
    public String getComentarioGestor() { return comentarioGestor; }
    public void setComentarioGestor(String comentarioGestor) { this.comentarioGestor = comentarioGestor; }
}