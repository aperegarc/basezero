package com.basezero.basezero.service;

import com.basezero.basezero.dto.cobro.*;
import com.basezero.basezero.entity.*;
import com.basezero.basezero.enums.EstadoVenta;
import com.basezero.basezero.repository.*;
import com.basezero.basezero.security.EmpresaContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class CobroService {

    private final CobroRepository cobroRepository;
    private final VentaRepository ventaRepository;
    private final UsuarioRepository usuarioRepository;

    public CobroService(CobroRepository cobroRepository, VentaRepository ventaRepository,
                        UsuarioRepository usuarioRepository) {
        this.cobroRepository = cobroRepository;
        this.ventaRepository = ventaRepository;
        this.usuarioRepository = usuarioRepository;
    }

    @Transactional(readOnly = true)
    public List<CobroResponseDTO> findAll() {
        return cobroRepository.findByVentaClienteEmpresaId(EmpresaContext.getEmpresaId())
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CobroResponseDTO> findByVenta(Long ventaId) {
        return cobroRepository.findByVentaIdAndVentaClienteEmpresaId(ventaId, EmpresaContext.getEmpresaId())
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional
    public CobroResponseDTO create(CobroRequestDTO dto, String username) {
        Venta venta = ventaRepository.findById(dto.getVentaId())
                .filter(v -> v.getCliente().getEmpresa().getId().equals(EmpresaContext.getEmpresaId()))
                .orElseThrow(() -> new RuntimeException("Venta no encontrada"));
        Usuario usuario = usuarioRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        // Total de la venta
        BigDecimal totalVenta = venta.getLineas().stream()
                .map(LineaVenta::getTotal)
                .filter(t -> t != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Ya cobrado anteriormente
        BigDecimal yaCobrado = cobroRepository.findByVentaId(venta.getId()).stream()
                .map(Cobro::getCantidad)
                .filter(c -> c != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal pendiente = totalVenta.subtract(yaCobrado);

        if (dto.getCantidad().compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("El importe debe ser mayor que 0");
        }

        if (dto.getCantidad().compareTo(pendiente) > 0) {
            throw new RuntimeException("El importe supera el pendiente de cobro: "
                    + pendiente.toPlainString() + " €");
        }

        Cobro cobro = new Cobro();
        cobro.setCantidad(dto.getCantidad());
        cobro.setFecha(dto.getFecha());
        cobro.setMetodoPago(dto.getMetodoPago());
        cobro.setVenta(venta);
        cobro.setUsuario(usuario);

        CobroResponseDTO result = toDTO(cobroRepository.save(cobro));

        // Si se ha cobrado todo, marcar venta como COBRADA
        BigDecimal totalCobrado = yaCobrado.add(dto.getCantidad());
        if (totalCobrado.compareTo(totalVenta) >= 0) {
            venta.setEstado(EstadoVenta.COBRADO);
            ventaRepository.save(venta);
        }

        return result;
    }

    @Transactional
    public void delete(Long id) {
        Cobro cobro = cobroRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cobro no encontrado"));

        // Si la venta estaba COBRADA, volver a PENDIENTE
        Venta venta = cobro.getVenta();
        cobroRepository.deleteById(id);

        if (venta != null && venta.getEstado() == EstadoVenta.COBRADO) {
            venta.setEstado(EstadoVenta.PENDIENTE);
            ventaRepository.save(venta);
        }
    }

    private CobroResponseDTO toDTO(Cobro c) {
        CobroResponseDTO dto = new CobroResponseDTO();
        dto.setId(c.getId());
        dto.setCantidad(c.getCantidad());
        dto.setFecha(c.getFecha());
        dto.setMetodoPago(c.getMetodoPago());
        dto.setVentaId(c.getVenta() != null ? c.getVenta().getId() : null);

        // Metadata: solo ADMINISTRADOR o GESTOR ven quién realizó el cobro
        if (EmpresaContext.puedeVerMetadata() && c.getUsuario() != null) {
            dto.setUsuarioId(c.getUsuario().getId());
            dto.setUsuarioNombre(c.getUsuario().getNombre()
                    + (c.getUsuario().getApellidos() != null ? " " + c.getUsuario().getApellidos() : ""));
        }
        return dto;
    }
}