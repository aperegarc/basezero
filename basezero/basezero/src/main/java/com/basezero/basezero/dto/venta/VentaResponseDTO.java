package com.basezero.basezero.dto.venta;

import com.basezero.basezero.enums.EstadoVenta;
import com.basezero.basezero.enums.MetodoPago;
import java.time.LocalDate;
import java.util.List;

public class VentaResponseDTO {

    private Long id;
    private String codigo;
    private EstadoVenta estado;
    private LocalDate fecha;
    private LocalDate vencimiento;
    private String direccionFiscal;
    private MetodoPago metodoPago;
    private Long clienteId;
    private String clienteNombre;
    private List<LineaVentaDTO> lineas;
    private Long contratoId;


    public VentaResponseDTO() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getCodigo() { return codigo; }
    public void setCodigo(String codigo) { this.codigo = codigo; }
    public EstadoVenta getEstado() { return estado; }
    public void setEstado(EstadoVenta estado) { this.estado = estado; }
    public LocalDate getFecha() { return fecha; }
    public void setFecha(LocalDate fecha) { this.fecha = fecha; }
    public LocalDate getVencimiento() { return vencimiento; }
    public void setVencimiento(LocalDate vencimiento) { this.vencimiento = vencimiento; }
    public String getDireccionFiscal() { return direccionFiscal; }
    public void setDireccionFiscal(String direccionFiscal) { this.direccionFiscal = direccionFiscal; }
    public MetodoPago getMetodoPago() { return metodoPago; }
    public void setMetodoPago(MetodoPago metodoPago) { this.metodoPago = metodoPago; }
    public Long getClienteId() { return clienteId; }
    public void setClienteId(Long clienteId) { this.clienteId = clienteId; }
    public String getClienteNombre() { return clienteNombre; }
    public void setClienteNombre(String clienteNombre) { this.clienteNombre = clienteNombre; }
    public List<LineaVentaDTO> getLineas() { return lineas; }
    public void setLineas(List<LineaVentaDTO> lineas) { this.lineas = lineas; }
    public Long getContratoId() { return contratoId; }
    public void setContratoId(Long contratoId) { this.contratoId = contratoId; }
}