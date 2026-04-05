package com.basezero.basezero.repository;

import com.basezero.basezero.entity.Venta;
import com.basezero.basezero.enums.EstadoVenta;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface VentaRepository extends JpaRepository<Venta, Long> {
    List<Venta> findByClienteId(Long clienteId);
    List<Venta> findByEstado(EstadoVenta estado);
    boolean existsByCodigo(String codigo);
    List<Venta> findByClienteEmpresaId(Long empresaId);
    List<Venta> findByClienteIdAndClienteEmpresaId(Long clienteId, Long empresaId);
}