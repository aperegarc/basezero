package com.basezero.basezero.service;

import com.basezero.basezero.dto.common.BulkResultDTO;
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
import java.util.*;
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
        validarPertenenciaEmpresa(empleado, cliente);
        Tarea tarea = construirTarea(empleado, cliente, dto.getZona(), dto.getFecha(), dto.getNotas());
        return toDTO(tareaRepository.save(tarea));
    }

    /**
     * Crea múltiples tareas a partir de una lista heterogénea de TareaRequestDTO.
     * Si {@code continuarSiHayErrores} es true, registra cada fallo individualmente
     * y sigue con el resto. Si es false, hace rollback al primer error.
     */
    @Transactional
    public BulkResultDTO<TareaResponseDTO> createBulk(TareaBulkRequestDTO request) {
        Long empresaId = EmpresaContext.getEmpresaId();
        BulkResultDTO<TareaResponseDTO> resultado = new BulkResultDTO<>();
        List<TareaRequestDTO> items = request.getTareas();

        Map<Long, Empleado> empleadosCache = cargarEmpleadosDeEmpresa(
                items.stream().map(TareaRequestDTO::getEmpleadoId).collect(Collectors.toSet()),
                empresaId);
        Map<Long, Cliente> clientesCache = cargarClientesDeEmpresa(
                items.stream().map(TareaRequestDTO::getClienteId).collect(Collectors.toSet()),
                empresaId);

        Set<String> existentes = request.isEvitarDuplicados()
                ? cargarClavesDuplicadosTarea(items, empresaId)
                : Collections.emptySet();

        List<Tarea> aGuardar = new ArrayList<>();

        for (int i = 0; i < items.size(); i++) {
            TareaRequestDTO dto = items.get(i);
            try {
                Empleado empleado = empleadosCache.get(dto.getEmpleadoId());
                if (empleado == null)
                    throw new RuntimeException("Empleado " + dto.getEmpleadoId() + " no existe en la empresa");
                Cliente cliente = clientesCache.get(dto.getClienteId());
                if (cliente == null)
                    throw new RuntimeException("Cliente " + dto.getClienteId() + " no existe en la empresa");

                if (request.isEvitarDuplicados()
                        && existentes.contains(claveDuplicado(empleado.getId(), cliente.getId(), dto.getZona(), dto.getFecha()))) {
                    resultado.incrementarOmitidos();
                    continue;
                }

                aGuardar.add(construirTarea(empleado, cliente, dto.getZona(), dto.getFecha(), dto.getNotas()));
            } catch (RuntimeException ex) {
                if (!request.isContinuarSiHayErrores()) throw ex;
                resultado.addError(i, ex.getMessage());
            }
        }

        for (Tarea guardada : tareaRepository.saveAll(aGuardar)) {
            resultado.addCreado(toDTO(guardada));
        }
        return resultado;
    }

    /**
     * Genera la misma tarea (cliente + zona) para una lista de empleados,
     * en cada fecha del rango [fechaInicio, fechaFin] que coincida con los días de la
     * semana indicados (o todos si no se especifican).
     */
    @Transactional
    public BulkResultDTO<TareaResponseDTO> programar(TareaProgramacionDTO dto) {
        Long empresaId = EmpresaContext.getEmpresaId();
        BulkResultDTO<TareaResponseDTO> resultado = new BulkResultDTO<>();

        if (dto.getFechaFin().isBefore(dto.getFechaInicio()))
            throw new RuntimeException("La fecha fin no puede ser anterior a la fecha inicio");

        Map<Long, Empleado> empleadosCache = cargarEmpleadosDeEmpresa(
                new HashSet<>(dto.getEmpleadoIds()), empresaId);

        for (Long empleadoId : dto.getEmpleadoIds()) {
            if (!empleadosCache.containsKey(empleadoId))
                resultado.addError(-1, "empleado:" + empleadoId,
                        "El empleado no pertenece a la empresa o no existe");
        }

        Cliente cliente = clienteRepository.findById(dto.getClienteId())
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado: " + dto.getClienteId()));
        if (cliente.getEmpresa() == null || !empresaId.equals(cliente.getEmpresa().getId()))
            throw new RuntimeException("El cliente no pertenece a la empresa");

        Set<java.time.DayOfWeek> diasFiltro = (dto.getDiasSemana() == null || dto.getDiasSemana().isEmpty())
                ? EnumSet.allOf(java.time.DayOfWeek.class)
                : EnumSet.copyOf(dto.getDiasSemana());

        Set<String> existentes = dto.isEvitarDuplicados()
                ? cargarClavesDuplicadosTareaPorRango(empleadosCache.keySet(), dto.getFechaInicio(), dto.getFechaFin())
                : Collections.emptySet();

        List<Tarea> aGuardar = new ArrayList<>();

        for (Empleado empleado : empleadosCache.values()) {
            LocalDate fecha = dto.getFechaInicio();
            while (!fecha.isAfter(dto.getFechaFin())) {
                if (diasFiltro.contains(fecha.getDayOfWeek())) {
                    if (dto.isEvitarDuplicados()
                            && existentes.contains(claveDuplicado(empleado.getId(), cliente.getId(), dto.getZona(), fecha))) {
                        resultado.incrementarOmitidos();
                    } else {
                        aGuardar.add(construirTarea(empleado, cliente, dto.getZona(), fecha, dto.getNotas()));
                    }
                }
                fecha = fecha.plusDays(1);
            }
        }

        for (Tarea guardada : tareaRepository.saveAll(aGuardar)) {
            resultado.addCreado(toDTO(guardada));
        }
        return resultado;
    }

    @Transactional
    public TareaResponseDTO subirVideo(Long tareaId, MultipartFile video, String comentario) throws IOException {
        Tarea tarea = tareaRepository.findById(tareaId)
                .orElseThrow(() -> new RuntimeException("Tarea no encontrada"));

        Path uploadPath = Paths.get(UPLOAD_DIR);
        if (!Files.exists(uploadPath)) Files.createDirectories(uploadPath);

        String filename = UUID.randomUUID() + "_" + video.getOriginalFilename();
        Path filePath = uploadPath.resolve(filename);

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

    // ------------------- helpers -------------------

    private Tarea construirTarea(Empleado empleado, Cliente cliente, String zona, LocalDate fecha, String notas) {
        Tarea tarea = new Tarea();
        tarea.setEmpleado(empleado);
        tarea.setCliente(cliente);
        tarea.setZona(zona);
        tarea.setFecha(fecha);
        tarea.setEstado(EstadoTarea.PENDIENTE);
        tarea.setNotas(notas);
        return tarea;
    }

    private Map<Long, Empleado> cargarEmpleadosDeEmpresa(Set<Long> ids, Long empresaId) {
        if (ids.isEmpty()) return Collections.emptyMap();
        return empleadoRepository.findAllById(ids).stream()
                .filter(e -> e.getEmpresa() != null && empresaId.equals(e.getEmpresa().getId()))
                .collect(Collectors.toMap(Empleado::getId, e -> e));
    }

    private Map<Long, Cliente> cargarClientesDeEmpresa(Set<Long> ids, Long empresaId) {
        if (ids.isEmpty()) return Collections.emptyMap();
        return clienteRepository.findAllById(ids).stream()
                .filter(c -> c.getEmpresa() != null && empresaId.equals(c.getEmpresa().getId()))
                .collect(Collectors.toMap(Cliente::getId, c -> c));
    }

    private Set<String> cargarClavesDuplicadosTarea(List<TareaRequestDTO> items, Long empresaId) {
        Set<Long> empleadoIds = items.stream().map(TareaRequestDTO::getEmpleadoId).collect(Collectors.toSet());
        if (empleadoIds.isEmpty()) return Collections.emptySet();
        LocalDate min = items.stream().map(TareaRequestDTO::getFecha).min(LocalDate::compareTo).orElseThrow();
        LocalDate max = items.stream().map(TareaRequestDTO::getFecha).max(LocalDate::compareTo).orElseThrow();
        return tareaRepository.findByEmpleadoIdInAndFechaBetween(empleadoIds, min, max).stream()
                .filter(t -> t.getEmpleado().getEmpresa() != null
                        && empresaId.equals(t.getEmpleado().getEmpresa().getId()))
                .map(t -> claveDuplicado(t.getEmpleado().getId(), t.getCliente().getId(), t.getZona(), t.getFecha()))
                .collect(Collectors.toSet());
    }

    private Set<String> cargarClavesDuplicadosTareaPorRango(Collection<Long> empleadoIds,
                                                            LocalDate desde, LocalDate hasta) {
        if (empleadoIds.isEmpty()) return Collections.emptySet();
        return tareaRepository.findByEmpleadoIdInAndFechaBetween(empleadoIds, desde, hasta).stream()
                .map(t -> claveDuplicado(t.getEmpleado().getId(), t.getCliente().getId(), t.getZona(), t.getFecha()))
                .collect(Collectors.toSet());
    }

    private String claveDuplicado(Long empleadoId, Long clienteId, String zona, LocalDate fecha) {
        return empleadoId + "|" + clienteId + "|" + (zona == null ? "" : zona) + "|" + fecha;
    }

    private void validarPertenenciaEmpresa(Empleado empleado, Cliente cliente) {
        Long empresaId = EmpresaContext.getEmpresaId();
        if (empleado.getEmpresa() == null || !empresaId.equals(empleado.getEmpresa().getId()))
            throw new RuntimeException("El empleado no pertenece a la empresa");
        if (cliente.getEmpresa() == null || !empresaId.equals(cliente.getEmpresa().getId()))
            throw new RuntimeException("El cliente no pertenece a la empresa");
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
