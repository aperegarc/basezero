package com.basezero.basezero.controller;

import com.basezero.basezero.dto.venta.*;
import com.basezero.basezero.service.VentaService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/ventas")
public class VentaController {

    private final VentaService ventaService;

    public VentaController(VentaService ventaService) {
        this.ventaService = ventaService;
    }

    @GetMapping
    public ResponseEntity<List<VentaResponseDTO>> findAll() {
        return ResponseEntity.ok(ventaService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<VentaResponseDTO> findById(@PathVariable Long id) {
        return ResponseEntity.ok(ventaService.findById(id));
    }

    @GetMapping("/cliente/{clienteId}")
    public ResponseEntity<List<VentaResponseDTO>> findByCliente(@PathVariable Long clienteId) {
        return ResponseEntity.ok(ventaService.findByCliente(clienteId));
    }

    @PostMapping
    public ResponseEntity<VentaResponseDTO> create(@Valid @RequestBody VentaRequestDTO dto) {
        return ResponseEntity.ok(ventaService.create(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<VentaResponseDTO> update(@PathVariable Long id,
                                                   @Valid @RequestBody VentaRequestDTO dto) {
        return ResponseEntity.ok(ventaService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        ventaService.delete(id);
        return ResponseEntity.noContent().build();
    }
}