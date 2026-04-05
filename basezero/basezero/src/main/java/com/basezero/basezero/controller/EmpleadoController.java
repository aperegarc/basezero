package com.basezero.basezero.controller;

import com.basezero.basezero.dto.empleado.*;
import com.basezero.basezero.service.EmpleadoService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/empleados")
public class EmpleadoController {

    private final EmpleadoService empleadoService;

    public EmpleadoController(EmpleadoService empleadoService) {
        this.empleadoService = empleadoService;
    }

    @GetMapping
    public ResponseEntity<List<EmpleadoResponseDTO>> findAll() {
        return ResponseEntity.ok(empleadoService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<EmpleadoResponseDTO> findById(@PathVariable Long id) {
        return ResponseEntity.ok(empleadoService.findById(id));
    }

    @PostMapping
    public ResponseEntity<EmpleadoResponseDTO> create(@Valid @RequestBody EmpleadoRequestDTO dto) {
        return ResponseEntity.ok(empleadoService.create(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<EmpleadoResponseDTO> update(@PathVariable Long id,
                                                      @Valid @RequestBody EmpleadoRequestDTO dto) {
        return ResponseEntity.ok(empleadoService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        empleadoService.delete(id);
        return ResponseEntity.noContent().build();
    }
}