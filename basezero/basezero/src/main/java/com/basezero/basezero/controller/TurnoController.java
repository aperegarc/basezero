package com.basezero.basezero.controller;

import com.basezero.basezero.dto.common.BulkResultDTO;
import com.basezero.basezero.dto.turno.*;
import com.basezero.basezero.service.TurnoService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/turnos")
@PreAuthorize("hasAnyRole('EMPLEADO', 'ADMINISTRADOR', 'GESTOR', 'OPERARIO')")
public class TurnoController {

    private final TurnoService turnoService;

    public TurnoController(TurnoService turnoService) {
        this.turnoService = turnoService;
    }

    @GetMapping
    public ResponseEntity<List<TurnoResponseDTO>> findAll() {
        return ResponseEntity.ok(turnoService.findAll());
    }

    @GetMapping("/empleado/{empleadoId}")
    public ResponseEntity<List<TurnoResponseDTO>> findByEmpleado(@PathVariable Long empleadoId) {
        return ResponseEntity.ok(turnoService.findByEmpleado(empleadoId));
    }

    @GetMapping("/empleado/{empleadoId}/semana")
    public ResponseEntity<List<TurnoResponseDTO>> findSemana(
            @PathVariable Long empleadoId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
        return ResponseEntity.ok(turnoService.findByEmpleadoSemana(empleadoId, desde, hasta));
    }

    @PostMapping
    public ResponseEntity<TurnoResponseDTO> create(@Valid @RequestBody TurnoRequestDTO dto) {
        return ResponseEntity.ok(turnoService.create(dto));
    }

    @PostMapping("/bulk")
    public ResponseEntity<BulkResultDTO<TurnoResponseDTO>> createBulk(
            @Valid @RequestBody TurnoBulkRequestDTO request) {
        return ResponseEntity.ok(turnoService.createBulk(request));
    }

    @PostMapping("/plantilla")
    public ResponseEntity<BulkResultDTO<TurnoResponseDTO>> aplicarPlantilla(
            @Valid @RequestBody TurnoPlantillaDTO request) {
        return ResponseEntity.ok(turnoService.aplicarPlantilla(request));
    }

    @PostMapping("/copiar-semana")
    public ResponseEntity<BulkResultDTO<TurnoResponseDTO>> copiarSemana(
            @Valid @RequestBody TurnoCopiarSemanaDTO request) {
        return ResponseEntity.ok(turnoService.copiarSemana(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TurnoResponseDTO> update(@PathVariable Long id, @Valid @RequestBody TurnoRequestDTO dto) {
        return ResponseEntity.ok(turnoService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        turnoService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
