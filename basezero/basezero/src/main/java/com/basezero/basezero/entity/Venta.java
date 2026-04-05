package com.basezero.basezero.entity;

import com.basezero.basezero.enums.EstadoVenta;
import com.basezero.basezero.enums.MetodoPago;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "ventas",
    uniqueConstraints = @UniqueConstraint(columnNames = {"empresa_id", "codigo"}))
@Builder
public class Venta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EstadoVenta estado;

    @Column(nullable = false)
    private LocalDate fecha;

    private String direccionFiscal;

    @Column(nullable = false)
    private String codigo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "empresa_id", nullable = false)
    private Empresa empresa;

    private LocalDate vencimiento;

    @Enumerated(EnumType.STRING)
    private MetodoPago metodoPago;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    @OneToMany(mappedBy = "venta", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<LineaVenta> lineas = new ArrayList<>();

    @OneToMany(mappedBy = "venta", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Cobro> cobros = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contrato_id")
    private ContratoRecurrente contrato;

    @Autowired
    public Venta() {
    }


    public Venta(Long id, EstadoVenta estado, LocalDate fecha, String direccionFiscal, String codigo, Empresa empresa, LocalDate vencimiento, MetodoPago metodoPago, Cliente cliente, List<LineaVenta> lineas, List<Cobro> cobros, ContratoRecurrente contrato) {
        this.id = id;
        this.estado = estado;
        this.fecha = fecha;
        this.direccionFiscal = direccionFiscal;
        this.codigo = codigo;
        this.empresa = empresa;
        this.vencimiento = vencimiento;
        this.metodoPago = metodoPago;
        this.cliente = cliente;
        this.lineas = lineas;
        this.cobros = cobros;
        this.contrato = contrato;
    }

    @Autowired


    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public EstadoVenta getEstado() {
        return estado;
    }

    public void setEstado(EstadoVenta estado) {
        this.estado = estado;
    }

    public LocalDate getFecha() {
        return fecha;
    }

    public void setFecha(LocalDate fecha) {
        this.fecha = fecha;
    }

    public String getDireccionFiscal() {
        return direccionFiscal;
    }

    public void setDireccionFiscal(String direccionFiscal) {
        this.direccionFiscal = direccionFiscal;
    }

    public String getCodigo() {
        return codigo;
    }

    public void setCodigo(String codigo) {
        this.codigo = codigo;
    }

    public LocalDate getVencimiento() {
        return vencimiento;
    }

    public void setVencimiento(LocalDate vencimiento) {
        this.vencimiento = vencimiento;
    }

    public MetodoPago getMetodoPago() {
        return metodoPago;
    }

    public void setMetodoPago(MetodoPago metodoPago) {
        this.metodoPago = metodoPago;
    }

    public Cliente getCliente() {
        return cliente;
    }

    public void setCliente(Cliente cliente) {
        this.cliente = cliente;
    }

    public List<LineaVenta> getLineas() {
        return lineas;
    }

    public void setLineas(List<LineaVenta> lineas) {
        this.lineas = lineas;
    }

    public List<Cobro> getCobros() {
        return cobros;
    }

    public void setCobros(List<Cobro> cobros) {
        this.cobros = cobros;
    }

    public ContratoRecurrente getContrato() { return contrato; }

    public void setContrato(ContratoRecurrente contrato) { this.contrato = contrato; }

    public Empresa getEmpresa() { return empresa; }

    public void setEmpresa(Empresa empresa) { this.empresa = empresa; }
}
