package com.basezero.basezero.repository;

import com.basezero.basezero.entity.Empleado;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EmpleadoRepository extends JpaRepository<Empleado, Long> {
    Optional<Empleado> findByDni(String dni);
    boolean existsByDni(String dni);
    List<Empleado> findByEmpresaId(Long empresaId);
    List<Empleado> findByEmpresaIdAndActivoTrue(Long empresaId);
}