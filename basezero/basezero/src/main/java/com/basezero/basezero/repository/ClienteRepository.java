package com.basezero.basezero.repository;

import com.basezero.basezero.entity.Cliente;
import com.basezero.basezero.enums.TipoCliente;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ClienteRepository extends JpaRepository<Cliente, Long> {
    List<Cliente> findByTipo(TipoCliente tipo);
    List<Cliente> findByNombreContainingIgnoreCase(String nombre);
    boolean existsByCifNif(String cifNif);
    List<Cliente> findByEmpresaId(Long empresaId);
    boolean existsByEmpresaId(Long empresaId);
}