package com.basezero.basezero.controller;

import com.basezero.basezero.dto.tarea.*;
import com.basezero.basezero.service.TareaService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/tareas")
@PreAuthorize("hasAnyRole('EMPLEADO', 'ADMINISTRADOR')")
public class TareaController {

    private final TareaService tareaService;

    public TareaController(TareaService tareaService) {
        this.tareaService = tareaService;
    }

    @GetMapping
    public ResponseEntity<List<TareaResponseDTO>> findAll() {
        return ResponseEntity.ok(tareaService.findAll());
    }

    @GetMapping("/empleado/{empleadoId}")
    public ResponseEntity<List<TareaResponseDTO>> findByEmpleado(@PathVariable Long empleadoId) {
        return ResponseEntity.ok(tareaService.findByEmpleado(empleadoId));
    }

    @GetMapping("/empleado/{empleadoId}/fecha/{fecha}")
    public ResponseEntity<List<TareaResponseDTO>> findByEmpleadoYFecha(
            @PathVariable Long empleadoId,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha) {
        return ResponseEntity.ok(tareaService.findByEmpleadoYFecha(empleadoId, fecha));
    }

    @GetMapping("/revision")
    public ResponseEntity<List<TareaResponseDTO>> findPendientesRevision() {
        return ResponseEntity.ok(tareaService.findPendientesRevision());
    }

    @GetMapping("/{id}")
    public ResponseEntity<TareaResponseDTO> findById(@PathVariable Long id) {
        return ResponseEntity.ok(tareaService.findById(id));
    }

    @PostMapping
    public ResponseEntity<TareaResponseDTO> create(@Valid @RequestBody TareaRequestDTO dto) {
        return ResponseEntity.ok(tareaService.create(dto));
    }

    @PostMapping("/{id}/video")
    public ResponseEntity<TareaResponseDTO> subirVideo(
            @PathVariable Long id,
            @RequestParam("video") MultipartFile video,
            @RequestParam(value = "comentario", required = false) String comentario) throws IOException {
        return ResponseEntity.ok(tareaService.subirVideo(id, video, comentario));
    }

    @PutMapping("/{id}/revisar")
    public ResponseEntity<TareaResponseDTO> revisar(
            @PathVariable Long id,
            @RequestParam boolean aprobada,
            @RequestParam(required = false) String comentario) {
        return ResponseEntity.ok(tareaService.revisar(id, aprobada, comentario));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        tareaService.delete(id);
        return ResponseEntity.noContent().build();
    }
}