package com.basezero.basezero.repository;

import com.basezero.basezero.entity.Venta;
import com.basezero.basezero.enums.EstadoVenta;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface VentaRepository extends JpaRepository<Venta, Long> {
    List<Venta> findByClienteId(Long clienteId);
    List<Venta> findByEstado(EstadoVenta estado);
    boolean existsByCodigo(String codigo);
    boolean existsByEmpresaIdAndCodigo(Long empresaId, String codigo);
    List<Venta> findByClienteEmpresaId(Long empresaId);
    List<Venta> findByClienteIdAndClienteEmpresaId(Long clienteId, Long empresaId);
    Optional<Venta> findFirstByContratoIdAndFechaBetween(Long contratoId, LocalDate desde, LocalDate hasta);
}
