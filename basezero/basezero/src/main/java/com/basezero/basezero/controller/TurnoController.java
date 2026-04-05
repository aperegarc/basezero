package com.basezero.basezero.controller;

import com.basezero.basezero.dto.turno.*;
import com.basezero.basezero.service.TurnoService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/turnos")
@PreAuthorize("hasAnyRole('EMPLEADO', 'ADMINISTRADOR')")
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
    public ResponseEntity<TurnoResponseDTO> create(@RequestBody TurnoRequestDTO dto) {
        return ResponseEntity.ok(turnoService.create(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TurnoResponseDTO> update(@PathVariable Long id, @RequestBody TurnoRequestDTO dto) {
        return ResponseEntity.ok(turnoService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        turnoService.delete(id);
        return ResponseEntity.noContent().build();
    }
}