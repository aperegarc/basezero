package com.basezero.basezero.repository;

import com.basezero.basezero.entity.Turno;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;

public interface TurnoRepository extends JpaRepository<Turno, Long> {
    List<Turno> findByEmpleadoId(Long empleadoId);
    List<Turno> findByEmpleadoIdAndFechaBetween(Long empleadoId, LocalDate desde, LocalDate hasta);
    List<Turno> findByFecha(LocalDate fecha);
    List<Turno> findByEmpleadoEmpresaId(Long empresaId);
    List<Turno> findByEmpleadoIdAndEmpleadoEmpresaId(Long empleadoId, Long empresaId);
}