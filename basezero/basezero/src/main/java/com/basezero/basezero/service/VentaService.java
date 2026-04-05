package com.basezero.basezero.service;

import com.basezero.basezero.dto.venta.*;
import com.basezero.basezero.entity.*;
import com.basezero.basezero.repository.*;
import com.basezero.basezero.security.EmpresaContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class VentaService {

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
        return toDTO(ventaRepository.findById(id)
                .filter(v -> v.getCliente().getEmpresa().getId().equals(EmpresaContext.getEmpresaId()))
                .orElseThrow(() -> new RuntimeException("Venta no encontrada: " + id)));
    }

    @Transactional
    public VentaResponseDTO create(VentaRequestDTO dto) {
        Long empresaId = EmpresaContext.getEmpresaId();
        Cliente cliente = clienteRepository.findById(dto.getClienteId())
                .filter(c -> c.getEmpresa().getId().equals(empresaId))
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));

        Venta venta = new Venta();
        venta.setEmpresa(cliente.getEmpresa());
        venta.setCliente(cliente);
        venta.setEstado(dto.getEstado());
        venta.setFecha(dto.getFecha());
        venta.setDireccionFiscal(dto.getDireccionFiscal());
        venta.setCodigo(dto.getCodigo());
        venta.setVencimiento(dto.getVencimiento());
        venta.setMetodoPago(dto.getMetodoPago());

        if (dto.getLineas() != null) {
            for (LineaVentaDTO l : dto.getLineas()) {
                LineaVenta linea = new LineaVenta();
                linea.setProducto(l.getProducto());
                linea.setNombre(l.getNombre());
                linea.setDescripcion(l.getDescripcion());
                linea.setUnidades(l.getUnidades());
                linea.setPrecio(l.getPrecio());
                linea.setDescuento(l.getDescuento());
                linea.setIva(l.getIva());
                linea.setTotal(l.getTotal());
                linea.setVenta(venta);
                venta.getLineas().add(linea);
            }
        }

        return toDTO(ventaRepository.save(venta));
    }

    @Transactional
    public VentaResponseDTO update(Long id, VentaRequestDTO dto) {
        Venta venta = ventaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Venta no encontrada: " + id));

        venta.setEstado(dto.getEstado());
        venta.setFecha(dto.getFecha());
        venta.setDireccionFiscal(dto.getDireccionFiscal());
        venta.setVencimiento(dto.getVencimiento());
        venta.setMetodoPago(dto.getMetodoPago());

        venta.getLineas().clear();
        if (dto.getLineas() != null) {
            for (LineaVentaDTO l : dto.getLineas()) {
                LineaVenta linea = new LineaVenta();
                linea.setProducto(l.getProducto());
                linea.setNombre(l.getNombre());
                linea.setDescripcion(l.getDescripcion());
                linea.setUnidades(l.getUnidades());
                linea.setPrecio(l.getPrecio());
                linea.setDescuento(l.getDescuento());
                linea.setIva(l.getIva());
                linea.setTotal(l.getTotal());
                linea.setVenta(venta);
                venta.getLineas().add(linea);
            }
        }

        return toDTO(ventaRepository.save(venta));
    }

    public void delete(Long id) {
        ventaRepository.deleteById(id);
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
        dto.setClienteId(v.getCliente().getId());
        dto.setClienteNombre(v.getCliente().getNombre());
        dto.setLineas(v.getLineas().stream().map(this::lineaToDTO).collect(Collectors.toList()));
        dto.setContratoId(v.getContrato() != null ? v.getContrato().getId() : null);
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