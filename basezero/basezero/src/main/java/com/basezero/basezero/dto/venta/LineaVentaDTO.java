package com.basezero.basezero.dto.venta;

import java.math.BigDecimal;

public class LineaVentaDTO {

    private Long id;
    private String producto;
    private String nombre;
    private String descripcion;
    private Integer unidades;
    private BigDecimal precio;
    private BigDecimal descuento;
    private BigDecimal iva;
    private BigDecimal total;

    public LineaVentaDTO() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getProducto() { return producto; }
    public void setProducto(String producto) { this.producto = producto; }
    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }
    public Integer getUnidades() { return unidades; }
    public void setUnidades(Integer unidades) { this.unidades = unidades; }
    public BigDecimal getPrecio() { return precio; }
    public void setPrecio(BigDecimal precio) { this.precio = precio; }
    public BigDecimal getDescuento() { return descuento; }
    public void setDescuento(BigDecimal descuento) { this.descuento = descuento; }
    public BigDecimal getIva() { return iva; }
    public void setIva(BigDecimal iva) { this.iva = iva; }
    public BigDecimal getTotal() { return total; }
    public void setTotal(BigDecimal total) { this.total = total; }
}