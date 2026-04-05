package com.basezero.basezero.dto.cobro;

import com.basezero.basezero.enums.MetodoPago;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;

public class CobroRequestDTO {

    @NotNull
    private BigDecimal cantidad;
    @NotNull
    private LocalDate fecha;
    @NotNull
    private MetodoPago metodoPago;
    @NotNull
    private Long ventaId;

    public CobroRequestDTO() {}

    public BigDecimal getCantidad() { return cantidad; }
    public void setCantidad(BigDecimal cantidad) { this.cantidad = cantidad; }
    public LocalDate getFecha() { return fecha; }
    public void setFecha(LocalDate fecha) { this.fecha = fecha; }
    public MetodoPago getMetodoPago() { return metodoPago; }
    public void setMetodoPago(MetodoPago metodoPago) { this.metodoPago = metodoPago; }
    public Long getVentaId() { return ventaId; }
    public void setVentaId(Long ventaId) { this.ventaId = ventaId; }
}