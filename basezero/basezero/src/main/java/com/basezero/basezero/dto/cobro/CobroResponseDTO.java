package com.basezero.basezero.dto.cobro;

import com.basezero.basezero.enums.MetodoPago;
import java.math.BigDecimal;
import java.time.LocalDate;

public class CobroResponseDTO {

    private Long id;
    private BigDecimal cantidad;
    private LocalDate fecha;
    private MetodoPago metodoPago;
    private Long ventaId;
    private String ventaCodigo;
    private String clienteNombre;
    private BigDecimal ventaTotal;

    // Metadata: solo visible para ADMINISTRADOR/GESTOR
    private Long usuarioId;
    private String usuarioNombre;

    public CobroResponseDTO() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public BigDecimal getCantidad() { return cantidad; }
    public void setCantidad(BigDecimal cantidad) { this.cantidad = cantidad; }
    public LocalDate getFecha() { return fecha; }
    public void setFecha(LocalDate fecha) { this.fecha = fecha; }
    public MetodoPago getMetodoPago() { return metodoPago; }
    public void setMetodoPago(MetodoPago metodoPago) { this.metodoPago = metodoPago; }
    public Long getVentaId() { return ventaId; }
    public void setVentaId(Long ventaId) { this.ventaId = ventaId; }
    public String getVentaCodigo() { return ventaCodigo; }
    public void setVentaCodigo(String ventaCodigo) { this.ventaCodigo = ventaCodigo; }
    public String getClienteNombre() { return clienteNombre; }
    public void setClienteNombre(String clienteNombre) { this.clienteNombre = clienteNombre; }
    public BigDecimal getVentaTotal() { return ventaTotal; }
    public void setVentaTotal(BigDecimal ventaTotal) { this.ventaTotal = ventaTotal; }
    public Long getUsuarioId() { return usuarioId; }
    public void setUsuarioId(Long usuarioId) { this.usuarioId = usuarioId; }
    public String getUsuarioNombre() { return usuarioNombre; }
    public void setUsuarioNombre(String usuarioNombre) { this.usuarioNombre = usuarioNombre; }
}
