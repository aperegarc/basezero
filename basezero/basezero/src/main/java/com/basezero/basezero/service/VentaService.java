package com.basezero.basezero.service;

import com.basezero.basezero.dto.venta.*;
import com.basezero.basezero.entity.*;
import com.basezero.basezero.enums.TipoDocumento;
import com.basezero.basezero.repository.*;
import com.basezero.basezero.security.EmpresaContext;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class VentaService {

    private static final BigDecimal CIEN = BigDecimal.valueOf(100);

    private final VentaRepository ventaRepository;
    private final ClienteRepository clienteRepository;

    public VentaService(VentaRepository ventaRepository, ClienteRepository clienteRepository) {
        this.ventaRepository = ventaRepository;
        this.clienteRepository = clienteRepository;
    }

    @Transactional(readOnly = true)
    public List<VentaResponseDTO> findAll() {
        return ventaRepository.findByClienteEmpresaId(EmpresaContext.getEmpresaId())
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<VentaResponseDTO> findByCliente(Long clienteId) {
        return ventaRepository.findByClienteIdAndClienteEmpresaId(clienteId, EmpresaContext.getEmpresaId())
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public VentaResponseDTO findById(Long id) {
        return toDTO(loadVentaPropia(id));
    }

    @Transactional
    public VentaResponseDTO create(VentaRequestDTO dto) {
        validarRequest(dto, false);
        Long empresaId = EmpresaContext.getEmpresaId();

        Cliente cliente = clienteRepository.findById(dto.getClienteId())
                .filter(c -> c.getEmpresa() != null && c.getEmpresa().getId().equals(empresaId))
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));

        String codigo = dto.getCodigo().trim();
        if (ventaRepository.existsByEmpresaIdAndCodigo(empresaId, codigo)) {
            throw new RuntimeException("Ya existe un documento con el código '" + codigo + "'");
        }

        Venta venta = new Venta();
        venta.setEmpresa(cliente.getEmpresa());
        venta.setCliente(cliente);
        venta.setEstado(dto.getEstado());
        venta.setFecha(dto.getFecha());
        venta.setDireccionFiscal(saneaDireccion(dto.getDireccionFiscal(), cliente));
        venta.setCodigo(codigo);
        venta.setVencimiento(dto.getVencimiento());
        venta.setMetodoPago(dto.getMetodoPago());
        venta.setTipo(dto.getTipo() != null ? dto.getTipo() : TipoDocumento.FACTURA);

        copiarLineas(dto.getLineas(), venta);

        try {
            return toDTO(ventaRepository.saveAndFlush(venta));
        } catch (DataIntegrityViolationException ex) {
            throw new RuntimeException("Ya existe un documento con el código '" + codigo + "'");
        }
    }

    @Transactional
    public VentaResponseDTO update(Long id, VentaRequestDTO dto) {
        validarRequest(dto, true);
        Venta venta = loadVentaPropia(id);

        venta.setEstado(dto.getEstado());
        venta.setFecha(dto.getFecha());
        venta.setDireccionFiscal(saneaDireccion(dto.getDireccionFiscal(), venta.getCliente()));
        venta.setVencimiento(dto.getVencimiento());
        venta.setMetodoPago(dto.getMetodoPago());
        if (dto.getTipo() != null) venta.setTipo(dto.getTipo());

        venta.getLineas().clear();
        copiarLineas(dto.getLineas(), venta);

        return toDTO(ventaRepository.save(venta));
    }

    @Transactional
    public void delete(Long id) {
        Venta venta = loadVentaPropia(id);
        ventaRepository.delete(venta);
    }

    private Venta loadVentaPropia(Long id) {
        Long empresaId = EmpresaContext.getEmpresaId();
        return ventaRepository.findById(id)
                .filter(v -> v.getCliente() != null
                        && v.getCliente().getEmpresa() != null
                        && v.getCliente().getEmpresa().getId().equals(empresaId))
                .orElseThrow(() -> new RuntimeException("Venta no encontrada: " + id));
    }

    private void validarRequest(VentaRequestDTO dto, boolean esUpdate) {
        if (dto == null) throw new RuntimeException("Datos de venta vacíos");
        if (!esUpdate && (dto.getCodigo() == null || dto.getCodigo().trim().isEmpty())) {
            throw new RuntimeException("El código es obligatorio");
        }
        if (dto.getEstado() == null) throw new RuntimeException("El estado es obligatorio");
        if (dto.getFecha() == null) throw new RuntimeException("La fecha es obligatoria");
        if (!esUpdate && dto.getClienteId() == null) {
            throw new RuntimeException("El cliente es obligatorio");
        }
        if (dto.getLineas() == null || dto.getLineas().isEmpty()) {
            throw new RuntimeException("Añade al menos una línea al documento");
        }
        for (int i = 0; i < dto.getLineas().size(); i++) {
            LineaVentaDTO l = dto.getLineas().get(i);
            int n = i + 1;
            String nombre = l.getNombre() != null ? l.getNombre().trim() : "";
            if (nombre.isEmpty()) {
                throw new RuntimeException("La línea " + n + " no tiene descripción");
            }
            if (l.getUnidades() == null || l.getUnidades() <= 0) {
                throw new RuntimeException("La línea " + n + " debe tener unidades > 0");
            }
            if (l.getPrecio() == null || l.getPrecio().signum() < 0) {
                throw new RuntimeException("La línea " + n + " tiene un precio inválido");
            }
        }
    }

    private void copiarLineas(List<LineaVentaDTO> lineas, Venta venta) {
        if (lineas == null) return;
        for (LineaVentaDTO l : lineas) {
            LineaVenta linea = new LineaVenta();
            linea.setProducto(l.getProducto());
            linea.setNombre(l.getNombre() != null ? l.getNombre().trim() : null);
            linea.setDescripcion(l.getDescripcion());
            linea.setUnidades(l.getUnidades());
            linea.setPrecio(nz(l.getPrecio()));
            linea.setDescuento(nz(l.getDescuento()));
            linea.setIva(nz(l.getIva()));
            linea.setTotal(calcularTotalLinea(l));
            linea.setVenta(venta);
            venta.getLineas().add(linea);
        }
    }

    /** El total se recalcula SIEMPRE en backend para evitar manipulaciones del cliente. */
    private BigDecimal calcularTotalLinea(LineaVentaDTO l) {
        BigDecimal precio = nz(l.getPrecio());
        BigDecimal uds = BigDecimal.valueOf(l.getUnidades() != null ? l.getUnidades() : 0);
        BigDecimal dto = nz(l.getDescuento());
        BigDecimal iva = nz(l.getIva());

        BigDecimal base = precio.multiply(uds)
                .multiply(CIEN.subtract(dto))
                .divide(CIEN, 4, RoundingMode.HALF_UP);
        BigDecimal conIva = base.multiply(CIEN.add(iva))
                .divide(CIEN, 2, RoundingMode.HALF_UP);
        return conIva;
    }

    private BigDecimal nz(BigDecimal v) {
        return v != null ? v : BigDecimal.ZERO;
    }

    private String saneaDireccion(String dir, Cliente cliente) {
        if (dir != null && !dir.trim().isEmpty()) return dir.trim();
        return cliente != null ? cliente.getDireccion() : null;
    }

    private VentaResponseDTO toDTO(Venta v) {
        VentaResponseDTO dto = new VentaResponseDTO();
        dto.setId(v.getId());
        dto.setCodigo(v.getCodigo());
        dto.setEstado(v.getEstado());
        dto.setFecha(v.getFecha());
        dto.setVencimiento(v.getVencimiento());
        dto.setDireccionFiscal(v.getDireccionFiscal());
        dto.setMetodoPago(v.getMetodoPago());
        dto.setTipo(v.getTipo() != null ? v.getTipo() : TipoDocumento.FACTURA);
        dto.setClienteId(v.getCliente() != null ? v.getCliente().getId() : null);
        dto.setClienteNombre(v.getCliente() != null ? v.getCliente().getNombre() : null);
        dto.setLineas(v.getLineas().stream().map(this::lineaToDTO).collect(Collectors.toList()));
        dto.setContratoId(v.getContrato() != null ? v.getContrato().getId() : null);

        // Totales calculados
        BigDecimal base = BigDecimal.ZERO;
        BigDecimal total = BigDecimal.ZERO;
        for (LineaVenta l : v.getLineas()) {
            BigDecimal precio = nz(l.getPrecio());
            BigDecimal uds = BigDecimal.valueOf(l.getUnidades() != null ? l.getUnidades() : 0);
            BigDecimal d = nz(l.getDescuento());
            BigDecimal lineaBase = precio.multiply(uds)
                    .multiply(CIEN.subtract(d))
                    .divide(CIEN, 4, RoundingMode.HALF_UP);
            base = base.add(lineaBase);
            total = total.add(nz(l.getTotal()));
        }
        base = base.setScale(2, RoundingMode.HALF_UP);
        total = total.setScale(2, RoundingMode.HALF_UP);
        dto.setBase(base);
        dto.setIvaTotal(total.subtract(base));
        dto.setTotal(total);
        return dto;
    }

    private LineaVentaDTO lineaToDTO(LineaVenta l) {
        LineaVentaDTO dto = new LineaVentaDTO();
        dto.setId(l.getId());
        dto.setProducto(l.getProducto());
        dto.setNombre(l.getNombre());
        dto.setDescripcion(l.getDescripcion());
        dto.setUnidades(l.getUnidades());
        dto.setPrecio(l.getPrecio());
        dto.setDescuento(l.getDescuento());
        dto.setIva(l.getIva());
        dto.setTotal(l.getTotal());
        return dto;
    }
}
