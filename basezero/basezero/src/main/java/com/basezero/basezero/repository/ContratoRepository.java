package com.basezero.basezero.repository;

import com.basezero.basezero.entity.ContratoRecurrente;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ContratoRepository extends JpaRepository<ContratoRecurrente, Long> {
    List<ContratoRecurrente> findByActivoTrue();
    List<ContratoRecurrente> findByClienteId(Long clienteId);
    List<ContratoRecurrente> findByClienteEmpresaId(Long empresaId);
    List<ContratoRecurrente> findByActivoTrueAndClienteEmpresaId(Long empresaId);
}