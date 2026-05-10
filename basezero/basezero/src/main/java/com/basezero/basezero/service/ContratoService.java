package com.basezero.basezero.service;

import com.basezero.basezero.dto.contrato.*;
import com.basezero.basezero.dto.venta.*;
import com.basezero.basezero.entity.*;
import com.basezero.basezero.enums.EstadoVenta;
import com.basezero.basezero.enums.TipoDocumento;
import com.basezero.basezero.repository.*;
import com.basezero.basezero.security.EmpresaContext;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ContratoService {

    private static final BigDecimal CIEN = BigDecimal.valueOf(100);

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
        return toDTO(loadPropio(id));
    }

    @Transactional
    public ContratoResponseDTO create(ContratoRequestDTO dto) {
        validar(dto);
        Long empresaId = EmpresaContext.getEmpresaId();

        Cliente cliente = clienteRepository.findById(dto.getClienteId())
                .filter(c -> c.getEmpresa() != null && c.getEmpresa().getId().equals(empresaId))
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));

        ContratoRecurrente contrato = new ContratoRecurrente();
        contrato.setCliente(cliente);
        contrato.setNombre(dto.getNombre().trim());
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
        validar(dto);
        Long empresaId = EmpresaContext.getEmpresaId();
        ContratoRecurrente contrato = loadPropio(id);

        Cliente cliente = clienteRepository.findById(dto.getClienteId())
                .filter(c -> c.getEmpresa() != null && c.getEmpresa().getId().equals(empresaId))
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));

        contrato.setCliente(cliente);
        contrato.setNombre(dto.getNombre().trim());
        contrato.setDescripcion(dto.getDescripcion());
        contrato.setImporte(dto.getImporte());
        contrato.setIva(dto.getIva());
        contrato.setMetodoPago(dto.getMetodoPago());
        contrato.setDiaGeneracion(dto.getDiaGeneracion());
        contrato.setActivo(dto.getActivo() != null ? dto.getActivo() : contrato.getActivo());

        return toDTO(contratoRepository.save(contrato));
    }

    /** Genera la venta del contrato. Si ya hay una de este mes, la devuelve en lugar de duplicar. */
    @Transactional
    public VentaResponseDTO generarVenta(Long contratoId) {
        ContratoRecurrente contrato = loadPropio(contratoId);

        if (Boolean.FALSE.equals(contrato.getActivo())) {
            throw new RuntimeException("El contrato está inactivo");
        }
        if (contrato.getCliente() == null || contrato.getCliente().getEmpresa() == null) {
            throw new RuntimeException("El contrato no tiene cliente válido asociado");
        }
        if (contrato.getImporte() == null || contrato.getIva() == null) {
            throw new RuntimeException("El contrato no tiene importe o IVA configurados");
        }

        LocalDate hoy = LocalDate.now();
        LocalDate inicioMes = hoy.withDayOfMonth(1);
        LocalDate finMes = hoy.withDayOfMonth(hoy.lengthOfMonth());

        // Idempotencia: si ya se generó una venta de este contrato este mes, devolver la existente.
        var existente = ventaRepository.findFirstByContratoIdAndFechaBetween(contrato.getId(), inicioMes, finMes);
        if (existente.isPresent()) {
            return ventaToDTO(existente.get());
        }

        String codigo = construirCodigo(contrato, hoy);

        BigDecimal base = contrato.getImporte();
        BigDecimal ivaAmount = base.multiply(contrato.getIva())
                .divide(CIEN, 2, RoundingMode.HALF_UP);
        BigDecimal total = base.add(ivaAmount).setScale(2, RoundingMode.HALF_UP);

        Venta venta = new Venta();
        venta.setCliente(contrato.getCliente());
        venta.setEmpresa(contrato.getCliente().getEmpresa());
        venta.setEstado(EstadoVenta.PENDIENTE);
        venta.setTipo(TipoDocumento.FACTURA);
        venta.setFecha(hoy);
        venta.setVencimiento(hoy.plusDays(30));
        venta.setCodigo(codigo);
        venta.setMetodoPago(contrato.getMetodoPago());
        venta.setDireccionFiscal(contrato.getCliente().getDireccion());
        venta.setContrato(contrato);

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

        Venta saved;
        try {
            saved = ventaRepository.saveAndFlush(venta);
        } catch (DataIntegrityViolationException ex) {
            // Hueco de carrera: otra petición ya generó la venta de este mes.
            var dup = ventaRepository.findFirstByContratoIdAndFechaBetween(contrato.getId(), inicioMes, finMes);
            if (dup.isPresent()) return ventaToDTO(dup.get());
            throw new RuntimeException("No se pudo generar la venta (código duplicado: " + codigo + ")");
        }

        contrato.setUltimaGeneracion(hoy);
        contratoRepository.save(contrato);

        return ventaToDTO(saved);
    }

    @Transactional
    public void delete(Long id) {
        ContratoRecurrente contrato = loadPropio(id);
        contratoRepository.delete(contrato);
    }

    private ContratoRecurrente loadPropio(Long id) {
        Long empresaId = EmpresaContext.getEmpresaId();
        return contratoRepository.findById(id)
                .filter(c -> c.getCliente() != null
                        && c.getCliente().getEmpresa() != null
                        && c.getCliente().getEmpresa().getId().equals(empresaId))
                .orElseThrow(() -> new RuntimeException("Contrato no encontrado: " + id));
    }

    private void validar(ContratoRequestDTO dto) {
        if (dto == null) throw new RuntimeException("Datos vacíos");
        if (dto.getClienteId() == null) throw new RuntimeException("El cliente es obligatorio");
        if (dto.getNombre() == null || dto.getNombre().trim().isEmpty()) {
            throw new RuntimeException("El nombre del contrato es obligatorio");
        }
        if (dto.getImporte() == null || dto.getImporte().signum() <= 0) {
            throw new RuntimeException("El importe debe ser mayor que 0");
        }
        if (dto.getIva() == null || dto.getIva().signum() < 0) {
            throw new RuntimeException("El IVA debe ser mayor o igual a 0");
        }
        if (dto.getDiaGeneracion() == null
                || dto.getDiaGeneracion() < 1
                || dto.getDiaGeneracion() > 28) {
            throw new RuntimeException("El día de generación debe estar entre 1 y 28");
        }
    }

    /** Construye un código tipo "PREFIJO-REC-MMYY-{contratoId}", saneando el nombre del cliente. */
    private String construirCodigo(ContratoRecurrente contrato, LocalDate fecha) {
        String mes = String.format("%02d", fecha.getMonthValue());
        String anyo = String.valueOf(fecha.getYear()).substring(2);

        String nombreCliente = contrato.getCliente() != null && contrato.getCliente().getNombre() != null
                ? contrato.getCliente().getNombre() : "CLI";
        String[] partes = nombreCliente.trim().split("\\s+");
        String prefijo = partes.length > 0 && !partes[0].isEmpty() ? partes[0] : "CLI";
        prefijo = prefijo.toUpperCase().replaceAll("[^A-Z0-9]", "");
        if (prefijo.isEmpty()) prefijo = "CLI";
        if (prefijo.length() > 6) prefijo = prefijo.substring(0, 6);

        return prefijo + "-REC-" + mes + anyo + "-" + contrato.getId();
    }

    private boolean esPendienteGeneracion(ContratoRecurrente c) {
        if (!Boolean.TRUE.equals(c.getActivo())) return false;
        LocalDate hoy = LocalDate.now();
        if (c.getDiaGeneracion() != null && hoy.getDayOfMonth() < c.getDiaGeneracion()) return false;
        if (c.getUltimaGeneracion() == null) return true;
        return c.getUltimaGeneracion().getMonth() != hoy.getMonth()
                || c.getUltimaGeneracion().getYear() != hoy.getYear();
    }

    private ContratoResponseDTO toDTO(ContratoRecurrente c) {
        ContratoResponseDTO dto = new ContratoResponseDTO();
        dto.setId(c.getId());
        dto.setClienteId(c.getCliente() != null ? c.getCliente().getId() : null);
        dto.setClienteNombre(c.getCliente() != null ? c.getCliente().getNombre() : null);
        dto.setNombre(c.getNombre());
        dto.setDescripcion(c.getDescripcion());
        dto.setImporte(c.getImporte());
        dto.setIva(c.getIva());
        BigDecimal importe = c.getImporte() != null ? c.getImporte() : BigDecimal.ZERO;
        BigDecimal iva = c.getIva() != null ? c.getIva() : BigDecimal.ZERO;
        BigDecimal ivaAmount = importe.multiply(iva).divide(CIEN, 2, RoundingMode.HALF_UP);
        dto.setTotalConIva(importe.add(ivaAmount));
        dto.setMetodoPago(c.getMetodoPago());
        dto.setDiaGeneracion(c.getDiaGeneracion());
        dto.setActivo(c.getActivo());
        dto.setUltimaGeneracion(c.getUltimaGeneracion());
        dto.setPendienteGeneracion(esPendienteGeneracion(c));
        return dto;
    }

    private VentaResponseDTO ventaToDTO(Venta v) {
        VentaResponseDTO dto = new VentaResponseDTO();
        dto.setId(v.getId());
        dto.setCodigo(v.getCodigo());
        dto.setEstado(v.getEstado());
        dto.setFecha(v.getFecha());
        dto.setVencimiento(v.getVencimiento());
        dto.setMetodoPago(v.getMetodoPago());
        dto.setTipo(v.getTipo());
        dto.setDireccionFiscal(v.getDireccionFiscal());
        dto.setClienteId(v.getCliente() != null ? v.getCliente().getId() : null);
        dto.setClienteNombre(v.getCliente() != null ? v.getCliente().getNombre() : null);
        dto.setContratoId(v.getContrato() != null ? v.getContrato().getId() : null);

        BigDecimal base = BigDecimal.ZERO;
        BigDecimal total = BigDecimal.ZERO;
        for (LineaVenta l : v.getLineas()) {
            BigDecimal precio = l.getPrecio() != null ? l.getPrecio() : BigDecimal.ZERO;
            BigDecimal uds = BigDecimal.valueOf(l.getUnidades() != null ? l.getUnidades() : 0);
            BigDecimal d = l.getDescuento() != null ? l.getDescuento() : BigDecimal.ZERO;
            BigDecimal lineaBase = precio.multiply(uds)
                    .multiply(CIEN.subtract(d))
                    .divide(CIEN, 4, RoundingMode.HALF_UP);
            base = base.add(lineaBase);
            total = total.add(l.getTotal() != null ? l.getTotal() : BigDecimal.ZERO);
        }
        dto.setBase(base.setScale(2, RoundingMode.HALF_UP));
        dto.setTotal(total.setScale(2, RoundingMode.HALF_UP));
        dto.setIvaTotal(dto.getTotal().subtract(dto.getBase()));
        return dto;
    }
}
