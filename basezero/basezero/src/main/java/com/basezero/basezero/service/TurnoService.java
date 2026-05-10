package com.basezero.basezero.service;

import com.basezero.basezero.dto.common.BulkResultDTO;
import com.basezero.basezero.dto.turno.*;
import com.basezero.basezero.entity.*;
import com.basezero.basezero.repository.*;
import com.basezero.basezero.security.EmpresaContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.*;
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

    @Transactional
    public TurnoResponseDTO create(TurnoRequestDTO dto) {
        Empleado empleado = cargarEmpleadoDeEmpresa(dto.getEmpleadoId());
        Turno turno = construirTurno(empleado, dto.getFecha(), dto.getHoraEntrada(), dto.getHoraSalida(), dto.getNotas());
        return toDTO(turnoRepository.save(turno));
    }

    /**
     * Crea múltiples turnos en una sola operación.
     * Aplica validación de pertenencia a empresa y, opcionalmente, filtra duplicados.
     */
    @Transactional
    public BulkResultDTO<TurnoResponseDTO> createBulk(TurnoBulkRequestDTO request) {
        Long empresaId = EmpresaContext.getEmpresaId();
        BulkResultDTO<TurnoResponseDTO> resultado = new BulkResultDTO<>();
        List<TurnoRequestDTO> items = request.getTurnos();

        Map<Long, Empleado> empleadosCache = cargarEmpleadosDeEmpresa(
                items.stream().map(TurnoRequestDTO::getEmpleadoId).collect(Collectors.toSet()),
                empresaId);

        Set<String> existentes = request.isEvitarDuplicados()
                ? cargarClavesDuplicadosTurno(items)
                : Collections.emptySet();

        List<Turno> aGuardar = new ArrayList<>();

        for (int i = 0; i < items.size(); i++) {
            TurnoRequestDTO dto = items.get(i);
            try {
                Empleado empleado = empleadosCache.get(dto.getEmpleadoId());
                if (empleado == null)
                    throw new RuntimeException("Empleado " + dto.getEmpleadoId() + " no existe en la empresa");

                if (!dto.getHoraSalida().isAfter(dto.getHoraEntrada()))
                    throw new RuntimeException("La hora de salida debe ser posterior a la de entrada");

                if (request.isEvitarDuplicados()
                        && existentes.contains(claveDuplicado(empleado.getId(), dto.getFecha()))) {
                    resultado.incrementarOmitidos();
                    continue;
                }

                aGuardar.add(construirTurno(empleado, dto.getFecha(), dto.getHoraEntrada(),
                        dto.getHoraSalida(), dto.getNotas()));
            } catch (RuntimeException ex) {
                if (!request.isContinuarSiHayErrores()) throw ex;
                resultado.addError(i, ex.getMessage());
            }
        }

        for (Turno guardado : turnoRepository.saveAll(aGuardar)) {
            resultado.addCreado(toDTO(guardado));
        }
        return resultado;
    }

    /**
     * Aplica una plantilla semanal a uno o varios empleados durante un rango de fechas.
     * Cada {@link HorarioDiaDTO} indica las horas a asignar para un día concreto de la semana.
     * Si {@code sobrescribir} es true, elimina primero los turnos existentes del rango.
     */
    @Transactional
    public BulkResultDTO<TurnoResponseDTO> aplicarPlantilla(TurnoPlantillaDTO dto) {
        Long empresaId = EmpresaContext.getEmpresaId();
        BulkResultDTO<TurnoResponseDTO> resultado = new BulkResultDTO<>();

        if (dto.getFechaFin().isBefore(dto.getFechaInicio()))
            throw new RuntimeException("La fecha fin no puede ser anterior a la fecha inicio");

        Map<Long, Empleado> empleadosCache = cargarEmpleadosDeEmpresa(
                new HashSet<>(dto.getEmpleadoIds()), empresaId);

        for (Long id : dto.getEmpleadoIds()) {
            if (!empleadosCache.containsKey(id))
                resultado.addError(-1, "empleado:" + id,
                        "El empleado no pertenece a la empresa o no existe");
        }

        Map<DayOfWeek, HorarioDiaDTO> mapaHorarios = new EnumMap<>(DayOfWeek.class);
        for (HorarioDiaDTO h : dto.getHorarios()) {
            if (!h.getHoraSalida().isAfter(h.getHoraEntrada()))
                throw new RuntimeException("Horario inválido para " + h.getDiaSemana()
                        + ": la salida debe ser posterior a la entrada");
            mapaHorarios.put(h.getDiaSemana(), h);
        }

        if (dto.isSobrescribir() && !empleadosCache.isEmpty()) {
            turnoRepository.deleteByEmpleadoIdInAndFechaBetween(
                    empleadosCache.keySet(), dto.getFechaInicio(), dto.getFechaFin());
            turnoRepository.flush();
        }

        Set<String> existentes = (dto.isEvitarDuplicados() && !dto.isSobrescribir())
                ? cargarClavesDuplicadosTurnoPorRango(empleadosCache.keySet(), dto.getFechaInicio(), dto.getFechaFin())
                : Collections.emptySet();

        List<Turno> aGuardar = new ArrayList<>();

        for (Empleado empleado : empleadosCache.values()) {
            LocalDate fecha = dto.getFechaInicio();
            while (!fecha.isAfter(dto.getFechaFin())) {
                HorarioDiaDTO horario = mapaHorarios.get(fecha.getDayOfWeek());
                if (horario != null) {
                    if (!dto.isSobrescribir() && dto.isEvitarDuplicados()
                            && existentes.contains(claveDuplicado(empleado.getId(), fecha))) {
                        resultado.incrementarOmitidos();
                    } else {
                        aGuardar.add(construirTurno(empleado, fecha,
                                horario.getHoraEntrada(), horario.getHoraSalida(), dto.getNotas()));
                    }
                }
                fecha = fecha.plusDays(1);
            }
        }

        for (Turno guardado : turnoRepository.saveAll(aGuardar)) {
            resultado.addCreado(toDTO(guardado));
        }
        return resultado;
    }

    /**
     * Copia los turnos de una semana a otra (o varias semanas consecutivas).
     * La semana origen se determina como la semana ISO (lunes-domingo) que contiene
     * la fecha {@code semanaOrigen}. Igual con {@code semanaDestino}.
     */
    @Transactional
    public BulkResultDTO<TurnoResponseDTO> copiarSemana(TurnoCopiarSemanaDTO dto) {
        Long empresaId = EmpresaContext.getEmpresaId();
        BulkResultDTO<TurnoResponseDTO> resultado = new BulkResultDTO<>();

        if (dto.getRepetirSemanas() < 1)
            throw new RuntimeException("repetirSemanas debe ser >= 1");

        Map<Long, Empleado> empleadosCache = cargarEmpleadosDeEmpresa(
                new HashSet<>(dto.getEmpleadoIds()), empresaId);

        for (Long id : dto.getEmpleadoIds()) {
            if (!empleadosCache.containsKey(id))
                resultado.addError(-1, "empleado:" + id,
                        "El empleado no pertenece a la empresa o no existe");
        }

        LocalDate origenLunes = dto.getSemanaOrigen()
                .with(java.time.temporal.TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate origenDomingo = origenLunes.plusDays(6);
        LocalDate destinoLunes = dto.getSemanaDestino()
                .with(java.time.temporal.TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));

        if (empleadosCache.isEmpty()) return resultado;

        List<Turno> origen = turnoRepository.findByEmpleadoIdInAndFechaBetween(
                empleadosCache.keySet(), origenLunes, origenDomingo);
        if (origen.isEmpty()) return resultado;

        LocalDate destinoFin = destinoLunes.plusDays(7L * dto.getRepetirSemanas() - 1);
        Set<String> existentes = dto.isEvitarDuplicados()
                ? cargarClavesDuplicadosTurnoPorRango(empleadosCache.keySet(), destinoLunes, destinoFin)
                : Collections.emptySet();

        List<Turno> aGuardar = new ArrayList<>();

        for (int semana = 0; semana < dto.getRepetirSemanas(); semana++) {
            for (Turno t : origen) {
                long offsetDesdeOrigenLunes = origenLunes.until(t.getFecha(), java.time.temporal.ChronoUnit.DAYS);
                LocalDate nuevaFecha = destinoLunes.plusWeeks(semana).plusDays(offsetDesdeOrigenLunes);

                if (dto.isEvitarDuplicados()
                        && existentes.contains(claveDuplicado(t.getEmpleado().getId(), nuevaFecha))) {
                    resultado.incrementarOmitidos();
                    continue;
                }
                aGuardar.add(construirTurno(t.getEmpleado(), nuevaFecha,
                        t.getHoraEntrada(), t.getHoraSalida(), t.getNotas()));
            }
        }

        for (Turno guardado : turnoRepository.saveAll(aGuardar)) {
            resultado.addCreado(toDTO(guardado));
        }
        return resultado;
    }

    @Transactional
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

    // ------------------- helpers -------------------

    private Turno construirTurno(Empleado empleado, LocalDate fecha,
                                 java.time.LocalTime entrada, java.time.LocalTime salida, String notas) {
        Turno turno = new Turno();
        turno.setEmpleado(empleado);
        turno.setFecha(fecha);
        turno.setHoraEntrada(entrada);
        turno.setHoraSalida(salida);
        turno.setNotas(notas);
        return turno;
    }

    private Empleado cargarEmpleadoDeEmpresa(Long empleadoId) {
        Empleado empleado = empleadoRepository.findById(empleadoId)
                .orElseThrow(() -> new RuntimeException("Empleado no encontrado"));
        Long empresaId = EmpresaContext.getEmpresaId();
        if (empleado.getEmpresa() == null || !empresaId.equals(empleado.getEmpresa().getId()))
            throw new RuntimeException("El empleado no pertenece a la empresa");
        return empleado;
    }

    private Map<Long, Empleado> cargarEmpleadosDeEmpresa(Set<Long> ids, Long empresaId) {
        if (ids.isEmpty()) return Collections.emptyMap();
        return empleadoRepository.findAllById(ids).stream()
                .filter(e -> e.getEmpresa() != null && empresaId.equals(e.getEmpresa().getId()))
                .collect(Collectors.toMap(Empleado::getId, e -> e));
    }

    private Set<String> cargarClavesDuplicadosTurno(List<TurnoRequestDTO> items) {
        Set<Long> empleadoIds = items.stream().map(TurnoRequestDTO::getEmpleadoId).collect(Collectors.toSet());
        if (empleadoIds.isEmpty()) return Collections.emptySet();
        LocalDate min = items.stream().map(TurnoRequestDTO::getFecha).min(LocalDate::compareTo).orElseThrow();
        LocalDate max = items.stream().map(TurnoRequestDTO::getFecha).max(LocalDate::compareTo).orElseThrow();
        return cargarClavesDuplicadosTurnoPorRango(empleadoIds, min, max);
    }

    private Set<String> cargarClavesDuplicadosTurnoPorRango(Collection<Long> empleadoIds,
                                                            LocalDate desde, LocalDate hasta) {
        if (empleadoIds.isEmpty()) return Collections.emptySet();
        return turnoRepository.findByEmpleadoIdInAndFechaBetween(empleadoIds, desde, hasta).stream()
                .map(t -> claveDuplicado(t.getEmpleado().getId(), t.getFecha()))
                .collect(Collectors.toSet());
    }

    private String claveDuplicado(Long empleadoId, LocalDate fecha) {
        return empleadoId + "|" + fecha;
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
