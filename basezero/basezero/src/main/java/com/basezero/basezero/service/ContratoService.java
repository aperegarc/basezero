package com.basezero.basezero.service;

import com.basezero.basezero.dto.contrato.*;
import com.basezero.basezero.dto.venta.*;
import com.basezero.basezero.entity.*;
import com.basezero.basezero.enums.EstadoVenta;
import com.basezero.basezero.repository.*;
import com.basezero.basezero.security.EmpresaContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ContratoService {

    private final ContratoRepository contratoRepository;
    private final ClienteRepository clienteRepository;
    private final VentaRepository ventaRepository;

    public ContratoService(ContratoRepository contratoRepository,
                           ClienteRepository clienteRepository,
                           VentaRepository ventaRepository) {
        this.contratoRepository = contratoRepository;
        this.clienteRepository = clienteRepository;
        this.ventaRepository = ventaRepository;
    }

    @Transactional(readOnly = true)
    public List<ContratoResponseDTO> findAll() {
        return contratoRepository.findByClienteEmpresaId(EmpresaContext.getEmpresaId())
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ContratoResponseDTO> findActivos() {
        return contratoRepository.findByActivoTrueAndClienteEmpresaId(EmpresaContext.getEmpresaId())
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ContratoResponseDTO findById(Long id) {
        return toDTO(contratoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Contrato no encontrado: " + id)));
    }

    @Transactional
    public ContratoResponseDTO create(ContratoRequestDTO dto) {
        Cliente cliente = clienteRepository.findById(dto.getClienteId())
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));

        ContratoRecurrente contrato = new ContratoRecurrente();
        contrato.setCliente(cliente);
        contrato.setNombre(dto.getNombre());
        contrato.setDescripcion(dto.getDescripcion());
        contrato.setImporte(dto.getImporte());
        contrato.setIva(dto.getIva());
        contrato.setMetodoPago(dto.getMetodoPago());
        contrato.setDiaGeneracion(dto.getDiaGeneracion());
        contrato.setActivo(dto.getActivo() != null ? dto.getActivo() : true);

        return toDTO(contratoRepository.save(contrato));
    }

    @Transactional
    public ContratoResponseDTO update(Long id, ContratoRequestDTO dto) {
        ContratoRecurrente contrato = contratoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Contrato no encontrado: " + id));

        Cliente cliente = clienteRepository.findById(dto.getClienteId())
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));

        contrato.setCliente(cliente);
        contrato.setNombre(dto.getNombre());
        contrato.setDescripcion(dto.getDescripcion());
        contrato.setImporte(dto.getImporte());
        contrato.setIva(dto.getIva());
        contrato.setMetodoPago(dto.getMetodoPago());
        contrato.setDiaGeneracion(dto.getDiaGeneracion());
        contrato.setActivo(dto.getActivo() != null ? dto.getActivo() : contrato.getActivo());

        return toDTO(contratoRepository.save(contrato));
    }

    @Transactional
    public VentaResponseDTO generarVenta(Long contratoId) {
        ContratoRecurrente contrato = contratoRepository.findById(contratoId)
                .orElseThrow(() -> new RuntimeException("Contrato no encontrado"));

        LocalDate hoy = LocalDate.now();
        String mes = String.format("%02d", hoy.getMonthValue());
        String anyo = String.valueOf(hoy.getYear()).substring(2);
        String codigo = contrato.getCliente().getNombre().split(" ")[0].toUpperCase()
                .substring(0, Math.min(6, contrato.getCliente().getNombre().split(" ")[0].length()))
                + "-REC-" + mes + anyo + "-" + contrato.getId();

        // Calcular total con IVA
        BigDecimal base = contrato.getImporte();
        BigDecimal ivaAmount = base.multiply(contrato.getIva()).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        BigDecimal total = base.add(ivaAmount);

        // Crear venta
        Venta venta = new Venta();
        venta.setCliente(contrato.getCliente());
        venta.setEmpresa(contrato.getCliente().getEmpresa());
        venta.setEstado(EstadoVenta.PENDIENTE);
        venta.setFecha(hoy);
        venta.setVencimiento(hoy.plusDays(30));
        venta.setCodigo(codigo);
        venta.setMetodoPago(contrato.getMetodoPago());
        venta.setDireccionFiscal(contrato.getCliente().getDireccion());

        // Crear línea
        LineaVenta linea = new LineaVenta();
        linea.setNombre(contrato.getNombre());
        linea.setDescripcion(contrato.getDescripcion());
        linea.setProducto("RECURRENTE");
        linea.setUnidades(1);
        linea.setPrecio(base);
        linea.setDescuento(BigDecimal.ZERO);
        linea.setIva(contrato.getIva());
        linea.setTotal(total);
        linea.setVenta(venta);
        venta.getLineas().add(linea);
        venta.setContrato(contrato);

        Venta saved = ventaRepository.save(venta);

        // Actualizar última generación
        contrato.setUltimaGeneracion(hoy);
        contratoRepository.save(contrato);

        // Construir respuesta
        VentaResponseDTO dto = new VentaResponseDTO();
        dto.setId(saved.getId());
        dto.setCodigo(saved.getCodigo());
        dto.setEstado(saved.getEstado());
        dto.setFecha(saved.getFecha());
        dto.setVencimiento(saved.getVencimiento());
        dto.setMetodoPago(saved.getMetodoPago());
        dto.setClienteId(saved.getCliente().getId());
        dto.setClienteNombre(saved.getCliente().getNombre());
        return dto;
    }

    @Transactional
    public void delete(Long id) {
        contratoRepository.deleteById(id);
    }

    private boolean esPendienteGeneracion(ContratoRecurrente c) {
        if (!c.getActivo()) return false;
        LocalDate hoy = LocalDate.now();
        if (c.getUltimaGeneracion() == null) return true;
        // Pendiente si no se ha generado este mes y ya llegó el día
        return c.getUltimaGeneracion().getMonth() != hoy.getMonth()
                || c.getUltimaGeneracion().getYear() != hoy.getYear();
    }

    private ContratoResponseDTO toDTO(ContratoRecurrente c) {
        ContratoResponseDTO dto = new ContratoResponseDTO();
        dto.setId(c.getId());
        dto.setClienteId(c.getCliente().getId());
        dto.setClienteNombre(c.getCliente().getNombre());
        dto.setNombre(c.getNombre());
        dto.setDescripcion(c.getDescripcion());
        dto.setImporte(c.getImporte());
        dto.setIva(c.getIva());
        BigDecimal ivaAmount = c.getImporte().multiply(c.getIva()).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        dto.setTotalConIva(c.getImporte().add(ivaAmount));
        dto.setMetodoPago(c.getMetodoPago());
        dto.setDiaGeneracion(c.getDiaGeneracion());
        dto.setActivo(c.getActivo());
        dto.setUltimaGeneracion(c.getUltimaGeneracion());
        dto.setPendienteGeneracion(esPendienteGeneracion(c));
        return dto;
    }
}