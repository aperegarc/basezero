package com.basezero.basezero.entity;

import com.basezero.basezero.enums.EstadoTarea;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "tareas")
public class Tarea {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "empleado_id", nullable = false)
    private Empleado empleado;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    @Column(nullable = false)
    private String zona;

    @Column(nullable = false)
    private LocalDate fecha;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EstadoTarea estado = EstadoTarea.PENDIENTE;

    private String videoUrl;

    @Column(columnDefinition = "TEXT")
    private String comentarioEmpleado;

    @Column(columnDefinition = "TEXT")
    private String comentarioGestor;

    private LocalDateTime fechaCompletada;

    private String notas;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Empleado getEmpleado() { return empleado; }
    public void setEmpleado(Empleado empleado) { this.empleado = empleado; }
    public Cliente getCliente() { return cliente; }
    public void setCliente(Cliente cliente) { this.cliente = cliente; }
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