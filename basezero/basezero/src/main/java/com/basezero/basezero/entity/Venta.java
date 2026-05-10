package com.basezero.basezero.entity;

import com.basezero.basezero.enums.EstadoVenta;
import com.basezero.basezero.enums.MetodoPago;
import com.basezero.basezero.enums.TipoDocumento;
import jakarta.persistence.*;
import lombok.Builder;

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
    @Column(nullable = false, length = 32)
    @Builder.Default
    private TipoDocumento tipo = TipoDocumento.FACTURA;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
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
    @Column(length = 32)
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

    public Venta() {
        this.lineas = new ArrayList<>();
        this.cobros = new ArrayList<>();
        this.tipo = TipoDocumento.FACTURA;
    }

    public Venta(Long id, TipoDocumento tipo, EstadoVenta estado, LocalDate fecha,
                 String direccionFiscal, String codigo, Empresa empresa, LocalDate vencimiento,
                 MetodoPago metodoPago, Cliente cliente, List<LineaVenta> lineas,
                 List<Cobro> cobros, ContratoRecurrente contrato) {
        this.id = id;
        this.tipo = tipo != null ? tipo : TipoDocumento.FACTURA;
        this.estado = estado;
        this.fecha = fecha;
        this.direccionFiscal = direccionFiscal;
        this.codigo = codigo;
        this.empresa = empresa;
        this.vencimiento = vencimiento;
        this.metodoPago = metodoPago;
        this.cliente = cliente;
        this.lineas = lineas != null ? lineas : new ArrayList<>();
        this.cobros = cobros != null ? cobros : new ArrayList<>();
        this.contrato = contrato;
    }

    public TipoDocumento getTipo() { return tipo; }
    public void setTipo(TipoDocumento tipo) { this.tipo = tipo != null ? tipo : TipoDocumento.FACTURA; }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

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

    public Cliente getCliente() { return cliente; }
    public void setCliente(Cliente cliente) { this.cliente = cliente; }

    public List<LineaVenta> getLineas() {
        if (lineas == null) lineas = new ArrayList<>();
        return lineas;
    }
    public void setLineas(List<LineaVenta> lineas) {
        this.lineas = lineas != null ? lineas : new ArrayList<>();
    }

    public List<Cobro> getCobros() {
        if (cobros == null) cobros = new ArrayList<>();
        return cobros;
    }
    public void setCobros(List<Cobro> cobros) {
        this.cobros = cobros != null ? cobros : new ArrayList<>();
    }

    public ContratoRecurrente getContrato() { return contrato; }
    public void setContrato(ContratoRecurrente contrato) { this.contrato = contrato; }

    public Empresa getEmpresa() { return empresa; }
    public void setEmpresa(Empresa empresa) { this.empresa = empresa; }
}
