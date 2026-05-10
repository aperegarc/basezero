package com.basezero.basezero.repository;

import com.basezero.basezero.entity.Turno;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;

public interface TurnoRepository extends JpaRepository<Turno, Long> {
    List<Turno> findByEmpleadoId(Long empleadoId);
    List<Turno> findByEmpleadoIdAndFechaBetween(Long empleadoId, LocalDate desde, LocalDate hasta);
    List<Turno> findByFecha(LocalDate fecha);
    List<Turno> findByEmpleadoEmpresaId(Long empresaId);
    List<Turno> findByEmpleadoIdAndEmpleadoEmpresaId(Long empleadoId, Long empresaId);

    List<Turno> findByEmpleadoIdInAndFechaBetween(Collection<Long> empleadoIds,
                                                  LocalDate desde,
                                                  LocalDate hasta);

    @Modifying
    @Query("DELETE FROM Turno t WHERE t.empleado.id IN :empleadoIds AND t.fecha BETWEEN :desde AND :hasta")
    int deleteByEmpleadoIdInAndFechaBetween(@Param("empleadoIds") Collection<Long> empleadoIds,
                                            @Param("desde") LocalDate desde,
                                            @Param("hasta") LocalDate hasta);
}
