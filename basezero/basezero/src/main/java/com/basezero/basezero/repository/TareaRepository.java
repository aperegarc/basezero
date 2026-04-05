package com.basezero.basezero.repository;

import com.basezero.basezero.entity.Tarea;
import com.basezero.basezero.enums.EstadoTarea;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;

public interface TareaRepository extends JpaRepository<Tarea, Long> {
    List<Tarea> findByEmpleadoId(Long empleadoId);
    List<Tarea> findByEmpleadoIdAndFecha(Long empleadoId, LocalDate fecha);
    List<Tarea> findByEstado(EstadoTarea estado);
    List<Tarea> findByClienteId(Long clienteId);
    List<Tarea> findByFecha(LocalDate fecha);
    List<Tarea> findByEmpleadoEmpresaId(Long empresaId);
    List<Tarea> findByEstadoAndEmpleadoEmpresaId(EstadoTarea estado, Long empresaId);
}