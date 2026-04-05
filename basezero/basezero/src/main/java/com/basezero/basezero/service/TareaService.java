package com.basezero.basezero.service;

import com.basezero.basezero.dto.tarea.*;
import com.basezero.basezero.entity.*;
import com.basezero.basezero.enums.EstadoTarea;
import com.basezero.basezero.repository.*;
import com.basezero.basezero.security.EmpresaContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class TareaService {

    private final TareaRepository tareaRepository;
    private final EmpleadoRepository empleadoRepository;
    private final ClienteRepository clienteRepository;

    private static final String UPLOAD_DIR = "uploads/videos/";

    public TareaService(TareaRepository tareaRepository,
                        EmpleadoRepository empleadoRepository,
                        ClienteRepository clienteRepository) {
        this.tareaRepository = tareaRepository;
        this.empleadoRepository = empleadoRepository;
        this.clienteRepository = clienteRepository;
    }

    @Transactional(readOnly = true)
    public List<TareaResponseDTO> findAll() {
        return tareaRepository.findByEmpleadoEmpresaId(EmpresaContext.getEmpresaId())
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<TareaResponseDTO> findPendientesRevision() {
        return tareaRepository.findByEstadoAndEmpleadoEmpresaId(
                        EstadoTarea.COMPLETADA, EmpresaContext.getEmpresaId())
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<TareaResponseDTO> findByEmpleado(Long empleadoId) {
        return tareaRepository.findByEmpleadoId(empleadoId).stream().map(this::toDTO).collect(Collectors.toList());
    }

    public List<TareaResponseDTO> findByEmpleadoYFecha(Long empleadoId, LocalDate fecha) {
        return tareaRepository.findByEmpleadoIdAndFecha(empleadoId, fecha).stream().map(this::toDTO).collect(Collectors.toList());
    }

    public TareaResponseDTO findById(Long id) {
        return toDTO(tareaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tarea no encontrada: " + id)));
    }

    @Transactional
    public TareaResponseDTO create(TareaRequestDTO dto) {
        Empleado empleado = empleadoRepository.findById(dto.getEmpleadoId())
                .orElseThrow(() -> new RuntimeException("Empleado no encontrado"));
        Cliente cliente = clienteRepository.findById(dto.getClienteId())
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));
        Tarea tarea = new Tarea();
        tarea.setEmpleado(empleado);
        tarea.setCliente(cliente);
        tarea.setZona(dto.getZona());
        tarea.setFecha(dto.getFecha());
        tarea.setEstado(EstadoTarea.PENDIENTE);
        tarea.setNotas(dto.getNotas());
        return toDTO(tareaRepository.save(tarea));
    }

    @Transactional
    public TareaResponseDTO subirVideo(Long tareaId, MultipartFile video, String comentario) throws IOException {
        Tarea tarea = tareaRepository.findById(tareaId)
                .orElseThrow(() -> new RuntimeException("Tarea no encontrada"));

        Path uploadPath = Paths.get(UPLOAD_DIR);
        if (!Files.exists(uploadPath)) Files.createDirectories(uploadPath);

        String filename = UUID.randomUUID() + "_" + video.getOriginalFilename();
        Path filePath = uploadPath.resolve(filename);

        // Borrar video anterior si existe
        if (tarea.getVideoUrl() != null) {
            try { Files.deleteIfExists(Paths.get(tarea.getVideoUrl())); } catch (Exception ignored) {}
        }

        Files.copy(video.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        tarea.setVideoUrl(filePath.toString());
        tarea.setComentarioEmpleado(comentario);
        tarea.setEstado(EstadoTarea.COMPLETADA);
        tarea.setFechaCompletada(LocalDateTime.now());

        return toDTO(tareaRepository.save(tarea));
    }

    @Transactional
    public TareaResponseDTO revisar(Long tareaId, boolean aprobada, String comentarioGestor) {
        Tarea tarea = tareaRepository.findById(tareaId)
                .orElseThrow(() -> new RuntimeException("Tarea no encontrada"));
        tarea.setEstado(aprobada ? EstadoTarea.APROBADA : EstadoTarea.RECHAZADA);
        tarea.setComentarioGestor(comentarioGestor);
        return toDTO(tareaRepository.save(tarea));
    }

    public void delete(Long id) {
        tareaRepository.deleteById(id);
    }

    private TareaResponseDTO toDTO(Tarea t) {
        TareaResponseDTO dto = new TareaResponseDTO();
        dto.setId(t.getId());
        dto.setEmpleadoId(t.getEmpleado().getId());
        dto.setEmpleadoNombre(t.getEmpleado().getNombre());
        dto.setClienteId(t.getCliente().getId());
        dto.setClienteNombre(t.getCliente().getNombre());
        dto.setZona(t.getZona());
        dto.setFecha(t.getFecha());
        dto.setEstado(t.getEstado());
        dto.setVideoUrl(t.getVideoUrl());
        dto.setComentarioEmpleado(t.getComentarioEmpleado());
        dto.setComentarioGestor(t.getComentarioGestor());
        dto.setFechaCompletada(t.getFechaCompletada());
        dto.setNotas(t.getNotas());
        return dto;
    }
}