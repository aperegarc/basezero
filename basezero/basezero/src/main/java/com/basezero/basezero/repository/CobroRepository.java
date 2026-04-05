package com.basezero.basezero.repository;

import com.basezero.basezero.entity.Cobro;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CobroRepository extends JpaRepository<Cobro, Long> {
    List<Cobro> findByVentaId(Long ventaId);
    List<Cobro> findByUsuarioId(Long usuarioId);
    List<Cobro> findByVentaClienteEmpresaId(Long empresaId);
    List<Cobro> findByVentaIdAndVentaClienteEmpresaId(Long ventaId, Long empresaId);
}