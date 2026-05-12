package com.basezero.basezero.repository;

import com.basezero.basezero.entity.Empleado;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface EmpleadoRepository extends JpaRepository<Empleado, Long> {
    Optional<Empleado> findByDni(String dni);

    @Query("SELECT e FROM Empleado e JOIN FETCH e.empresa WHERE e.dni = :dni")
    Optional<Empleado> findByDniWithEmpresa(@Param("dni") String dni);
    boolean existsByDni(String dni);
    List<Empleado> findByEmpresaId(Long empresaId);
    List<Empleado> findByEmpresaIdAndActivoTrue(Long empresaId);
}