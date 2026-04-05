package com.basezero.basezero.entity;

import com.basezero.basezero.enums.MetodoPago;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "contratos_recurrentes")
public class ContratoRecurrente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    @Column(nullable = false)
    private String nombre;

    @Column(columnDefinition = "TEXT")
    private String descripcion;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal importe;

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal iva;

    @Enumerated(EnumType.STRING)
    private MetodoPago metodoPago;

    @Column(nullable = false)
    private Integer diaGeneracion;

    @Column(nullable = false)
    private Boolean activo = true;

    private LocalDate ultimaGeneracion;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Cliente getCliente() { return cliente; }
    public void setCliente(Cliente cliente) { this.cliente = cliente; }
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
    public LocalDate getUltimaGeneracion() { return ultimaGeneracion; }
    public void setUltimaGeneracion(LocalDate ultimaGeneracion) { this.ultimaGeneracion = ultimaGeneracion; }
}