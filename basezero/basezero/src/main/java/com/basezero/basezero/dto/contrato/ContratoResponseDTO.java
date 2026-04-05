package com.basezero.basezero.dto.contrato;

import com.basezero.basezero.enums.MetodoPago;
import java.math.BigDecimal;
import java.time.LocalDate;

public class ContratoResponseDTO {

    private Long id;
    private Long clienteId;
    private String clienteNombre;
    private String nombre;
    private String descripcion;
    private BigDecimal importe;
    private BigDecimal iva;
    private BigDecimal totalConIva;
    private MetodoPago metodoPago;
    private Integer diaGeneracion;
    private Boolean activo;
    private LocalDate ultimaGeneracion;
    private Boolean pendienteGeneracion;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getClienteId() { return clienteId; }
    public void setClienteId(Long clienteId) { this.clienteId = clienteId; }
    public String getClienteNombre() { return clienteNombre; }
    public void setClienteNombre(String clienteNombre) { this.clienteNombre = clienteNombre; }
    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }
    public BigDecimal getImporte() { return importe; }
    public void setImporte(BigDecimal importe) { this.importe = importe; }
    public BigDecimal getIva() { return iva; }
    public void setIva(BigDecimal iva) { this.iva = iva; }
    public BigDecimal getTotalConIva() { return totalConIva; }
    public void setTotalConIva(BigDecimal totalConIva) { this.totalConIva = totalConIva; }
    public MetodoPago getMetodoPago() { return metodoPago; }
    public void setMetodoPago(MetodoPago metodoPago) { this.metodoPago = metodoPago; }
    public Integer getDiaGeneracion() { return diaGeneracion; }
    public void setDiaGeneracion(Integer diaGeneracion) { this.diaGeneracion = diaGeneracion; }
    public Boolean getActivo() { return activo; }
    public void setActivo(Boolean activo) { this.activo = activo; }
    public LocalDate getUltimaGeneracion() { return ultimaGeneracion; }
    public void setUltimaGeneracion(LocalDate ultimaGeneracion) { this.ultimaGeneracion = ultimaGeneracion; }
    public Boolean getPendienteGeneracion() { return pendienteGeneracion; }
    public void setPendienteGeneracion(Boolean pendienteGeneracion) { this.pendienteGeneracion = pendienteGeneracion; }
}