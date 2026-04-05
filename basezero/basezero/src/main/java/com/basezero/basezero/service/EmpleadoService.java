package com.basezero.basezero.service;

import com.basezero.basezero.dto.empleado.*;
import com.basezero.basezero.entity.Empleado;
import com.basezero.basezero.entity.Empresa;
import com.basezero.basezero.enums.EstadoTarea;
import com.basezero.basezero.repository.EmpleadoRepository;
import com.basezero.basezero.repository.EmpresaRepository;
import com.basezero.basezero.repository.TareaRepository;
import com.basezero.basezero.security.EmpresaContext;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class EmpleadoService {

    private final EmpleadoRepository empleadoRepository;
    private final EmpresaRepository empresaRepository;
    private final TareaRepository tareaRepository;
    private final PasswordEncoder passwordEncoder;

    public EmpleadoService(EmpleadoRepository empleadoRepository, EmpresaRepository empresaRepository, TareaRepository tareaRepository, PasswordEncoder passwordEncoder) {
        this.empleadoRepository = empleadoRepository;
        this.empresaRepository = empresaRepository;
        this.tareaRepository = tareaRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public List<EmpleadoResponseDTO> findAll() {
        return empleadoRepository.findByEmpresaId(EmpresaContext.getEmpresaId())
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    public EmpleadoResponseDTO findById(Long id) {
        return toDTO(empleadoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Empleado no encontrado: " + id)));
    }

    @Transactional
    public EmpleadoResponseDTO create(EmpleadoRequestDTO dto) {
        Empresa empresa = empresaRepository.findById(EmpresaContext.getEmpresaId())
                .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));
        if (empleadoRepository.existsByDni(dto.getDni()))
            throw new RuntimeException("Ya existe un empleado con ese DNI");
        Empleado e = new Empleado();
        e.setNombre(dto.getNombre());
        e.setDni(dto.getDni().toUpperCase());
        e.setPassword(passwordEncoder.encode(dto.getPassword()));
        e.setTelefono(dto.getTelefono());
        e.setSalarioMensual(dto.getSalarioMensual());
        e.setActivo(dto.getActivo() != null ? dto.getActivo() : true);
        e.setEmpresa(empresa);
        e.setFechaAlta(dto.getFechaAlta() != null ? dto.getFechaAlta() : LocalDate.now());
        return toDTO(empleadoRepository.save(e));
    }

    public EmpleadoResponseDTO update(Long id, EmpleadoRequestDTO dto) {
        Empleado e = empleadoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Empleado no encontrado: " + id));
        e.setNombre(dto.getNombre());
        e.setTelefono(dto.getTelefono());
        e.setSalarioMensual(dto.getSalarioMensual());
        e.setActivo(dto.getActivo() != null ? dto.getActivo() : e.getActivo());
        if (dto.getPassword() != null && !dto.getPassword().isBlank())
            e.setPassword(passwordEncoder.encode(dto.getPassword()));
        return toDTO(empleadoRepository.save(e));
    }

    public void delete(Long id) {
        empleadoRepository.deleteById(id);
    }

    private EmpleadoResponseDTO toDTO(Empleado e) {
        EmpleadoResponseDTO dto = new EmpleadoResponseDTO();
        dto.setId(e.getId());
        dto.setNombre(e.getNombre());
        dto.setDni(e.getDni());
        dto.setTelefono(e.getTelefono());
        dto.setSalarioMensual(e.getSalarioMensual());
        dto.setActivo(e.getActivo());
        dto.setFechaAlta(e.getFechaAlta());
        List<com.basezero.basezero.entity.Tarea> tareas = tareaRepository.findByEmpleadoId(e.getId());
        dto.setTotalTareas(tareas.size());
        dto.setTareasCompletadas((int) tareas.stream().filter(t -> t.getEstado() == EstadoTarea.APROBADA).count());
        dto.setTareasPendientes((int) tareas.stream().filter(t -> t.getEstado() == EstadoTarea.PENDIENTE).count());
        return dto;
    }
}