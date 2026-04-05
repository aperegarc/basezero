package com.basezero.basezero.service;

import com.basezero.basezero.dto.turno.*;
import com.basezero.basezero.entity.*;
import com.basezero.basezero.repository.*;
import com.basezero.basezero.security.EmpresaContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class TurnoService {

    private final TurnoRepository turnoRepository;
    private final EmpleadoRepository empleadoRepository;

    public TurnoService(TurnoRepository turnoRepository, EmpleadoRepository empleadoRepository) {
        this.turnoRepository = turnoRepository;
        this.empleadoRepository = empleadoRepository;
    }

    @Transactional(readOnly = true)
    public List<TurnoResponseDTO> findAll() {
        return turnoRepository.findByEmpleadoEmpresaId(EmpresaContext.getEmpresaId())
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<TurnoResponseDTO> findByEmpleado(Long empleadoId) {
        return turnoRepository.findByEmpleadoIdAndEmpleadoEmpresaId(
                        empleadoId, EmpresaContext.getEmpresaId())
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    public List<TurnoResponseDTO> findByEmpleadoSemana(Long empleadoId, LocalDate desde, LocalDate hasta) {
        return turnoRepository.findByEmpleadoIdAndFechaBetween(empleadoId, desde, hasta)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    public List<TurnoResponseDTO> findByFecha(LocalDate fecha) {
        return turnoRepository.findByFecha(fecha).stream().map(this::toDTO).collect(Collectors.toList());
    }

    public TurnoResponseDTO create(TurnoRequestDTO dto) {
        Empleado empleado = empleadoRepository.findById(dto.getEmpleadoId())
                .orElseThrow(() -> new RuntimeException("Empleado no encontrado"));
        Turno turno = new Turno();
        turno.setEmpleado(empleado);
        turno.setFecha(dto.getFecha());
        turno.setHoraEntrada(dto.getHoraEntrada());
        turno.setHoraSalida(dto.getHoraSalida());
        turno.setNotas(dto.getNotas());
        return toDTO(turnoRepository.save(turno));
    }

    public TurnoResponseDTO update(Long id, TurnoRequestDTO dto) {
        Turno turno = turnoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Turno no encontrado"));
        turno.setFecha(dto.getFecha());
        turno.setHoraEntrada(dto.getHoraEntrada());
        turno.setHoraSalida(dto.getHoraSalida());
        turno.setNotas(dto.getNotas());
        return toDTO(turnoRepository.save(turno));
    }

    public void delete(Long id) {
        turnoRepository.deleteById(id);
    }

    private TurnoResponseDTO toDTO(Turno t) {
        TurnoResponseDTO dto = new TurnoResponseDTO();
        dto.setId(t.getId());
        dto.setEmpleadoId(t.getEmpleado().getId());
        dto.setEmpleadoNombre(t.getEmpleado().getNombre());
        dto.setFecha(t.getFecha());
        dto.setHoraEntrada(t.getHoraEntrada());
        dto.setHoraSalida(t.getHoraSalida());
        dto.setNotas(t.getNotas());
        return dto;
    }
}