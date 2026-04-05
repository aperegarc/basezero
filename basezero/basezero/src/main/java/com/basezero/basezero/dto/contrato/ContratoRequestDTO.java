package com.basezero.basezero.dto.contrato;

import com.basezero.basezero.enums.MetodoPago;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public class ContratoRequestDTO {

    @NotNull
    private Long clienteId;
    @NotBlank
    private String nombre;
    private String descripcion;
    @NotNull
    private BigDecimal importe;
    @NotNull
    private BigDecimal iva;
    private MetodoPago metodoPago;
    @NotNull
    private Integer diaGeneracion;
    private Boolean activo = true;

    public Long getClienteId() { return clienteId; }
    public void setClienteId(Long clienteId) { this.clienteId = clienteId; }
    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }
    public BigDecimal getImporte() { return importe; }
    public void setImporte(BigDecimal importe) { this.importe = importe; }
    public BigDecimal getIva() { return iva; }
    public void setIva(BigDecimal iva) { this.iva = iva; }
    public MetodoPago getMetodoPago() { return metodoPago; }
    public void setMetodoPago(MetodoPago metodoPago) { this.metodoPago = metodoPago; }
    public Integer getDiaGeneracion() { return diaGeneracion; }
    public void setDiaGeneracion(Integer diaGeneracion) { this.diaGeneracion = diaGeneracion; }
    public Boolean getActivo() { return activo; }
    public void setActivo(Boolean activo) { this.activo = activo; }
}