package com.basezero.basezero.dto.tarea;

import com.basezero.basezero.enums.EstadoTarea;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class TareaResponseDTO {

    private Long id;
    private Long empleadoId;
    private String empleadoNombre;
    private Long clienteId;
    private String clienteNombre;
    private String zona;
    private LocalDate fecha;
    private EstadoTarea estado;
    private String videoUrl;
    private String comentarioEmpleado;
    private String comentarioGestor;
    private LocalDateTime fechaCompletada;
    private String notas;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getEmpleadoId() { return empleadoId; }
    public void setEmpleadoId(Long empleadoId) { this.empleadoId = empleadoId; }
    public String getEmpleadoNombre() { return empleadoNombre; }
    public void setEmpleadoNombre(String empleadoNombre) { this.empleadoNombre = empleadoNombre; }
    public Long getClienteId() { return clienteId; }
    public void setClienteId(Long clienteId) { this.clienteId = clienteId; }
    public String getClienteNombre() { return clienteNombre; }
    public void setClienteNombre(String clienteNombre) { this.clienteNombre = clienteNombre; }
    public String getZona() { return zona; }
    public void setZona(String zona) { this.zona = zona; }
    public LocalDate getFecha() { return fecha; }
    public void setFecha(LocalDate fecha) { this.fecha = fecha; }
    public EstadoTarea getEstado() { return estado; }
    public void setEstado(EstadoTarea estado) { this.estado = estado; }
    public String getVideoUrl() { return videoUrl; }
    public void setVideoUrl(String videoUrl) { this.videoUrl = videoUrl; }
    public String getComentarioEmpleado() { return comentarioEmpleado; }
    public void setComentarioEmpleado(String comentarioEmpleado) { this.comentarioEmpleado = comentarioEmpleado; }
    public String getComentarioGestor() { return comentarioGestor; }
    public void setComentarioGestor(String comentarioGestor) { this.comentarioGestor = comentarioGestor; }
    public LocalDateTime getFechaCompletada() { return fechaCompletada; }
    public void setFechaCompletada(LocalDateTime fechaCompletada) { this.fechaCompletada = fechaCompletada; }
    public String getNotas() { return notas; }
    public void setNotas(String notas) { this.notas = notas; }
}