package com.basezero.basezero.controller;

import com.basezero.basezero.dto.contrato.*;
import com.basezero.basezero.dto.venta.VentaResponseDTO;
import com.basezero.basezero.service.ContratoService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/contratos")
public class ContratoController {

    private final ContratoService contratoService;

    public ContratoController(ContratoService contratoService) {
        this.contratoService = contratoService;
    }

    @GetMapping
    public ResponseEntity<List<ContratoResponseDTO>> findAll() {
        return ResponseEntity.ok(contratoService.findAll());
    }

    @GetMapping("/activos")
    public ResponseEntity<List<ContratoResponseDTO>> findActivos() {
        return ResponseEntity.ok(contratoService.findActivos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ContratoResponseDTO> findById(@PathVariable Long id) {
        return ResponseEntity.ok(contratoService.findById(id));
    }

    @PostMapping
    public ResponseEntity<ContratoResponseDTO> create(@Valid @RequestBody ContratoRequestDTO dto) {
        return ResponseEntity.ok(contratoService.create(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ContratoResponseDTO> update(@PathVariable Long id,
                                                      @Valid @RequestBody ContratoRequestDTO dto) {
        return ResponseEntity.ok(contratoService.update(id, dto));
    }

    @PostMapping("/{id}/generar")
    public ResponseEntity<VentaResponseDTO> generarVenta(@PathVariable Long id) {
        return ResponseEntity.ok(contratoService.generarVenta(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        contratoService.delete(id);
        return ResponseEntity.noContent().build();
    }
}