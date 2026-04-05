package com.basezero.basezero.dto.venta;

import com.basezero.basezero.enums.EstadoVenta;
import com.basezero.basezero.enums.MetodoPago;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.List;

public class VentaRequestDTO {

    @NotNull
    private Long clienteId;
    @NotNull
    private EstadoVenta estado;
    @NotNull
    private LocalDate fecha;
    private String direccionFiscal;
    @NotNull
    private String codigo;
    private LocalDate vencimiento;
    private MetodoPago metodoPago;
    private List<LineaVentaDTO> lineas;

    public VentaRequestDTO() {}

    public Long getClienteId() { return clienteId; }
    public void setClienteId(Long clienteId) { this.clienteId = clienteId; }
    public EstadoVenta getEstado() { return estado; }
    public void setEstado(EstadoVenta estado) { this.estado = estado; }
    public LocalDate getFecha() { return fecha; }
    public void setFecha(LocalDate fecha) { this.fecha = fecha; }
    public String getDireccionFiscal() { return direccionFiscal; }
    public void setDireccionFiscal(String direccionFiscal) { this.direccionFiscal = direccionFiscal; }
    public String getCodigo() { return codigo; }
    public void setCodigo(String codigo) { this.codigo = codigo; }
    public LocalDate getVencimiento() { return vencimiento; }
    public void setVencimiento(LocalDate vencimiento) { this.vencimiento = vencimiento; }
    public MetodoPago getMetodoPago() { return metodoPago; }
    public void setMetodoPago(MetodoPago metodoPago) { this.metodoPago = metodoPago; }
    public List<LineaVentaDTO> getLineas() { return lineas; }
    public void setLineas(List<LineaVentaDTO> lineas) { this.lineas = lineas; }
}