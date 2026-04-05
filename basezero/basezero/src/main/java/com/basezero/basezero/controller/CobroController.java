package com.basezero.basezero.controller;

import com.basezero.basezero.dto.cobro.*;
import com.basezero.basezero.service.CobroService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/cobros")
public class CobroController {

    private final CobroService cobroService;

    public CobroController(CobroService cobroService) {
        this.cobroService = cobroService;
    }

    @GetMapping
    public ResponseEntity<List<CobroResponseDTO>> findAll() {
        return ResponseEntity.ok(cobroService.findAll());
    }

    @GetMapping("/venta/{ventaId}")
    public ResponseEntity<List<CobroResponseDTO>> findByVenta(@PathVariable Long ventaId) {
        return ResponseEntity.ok(cobroService.findByVenta(ventaId));
    }

    @PostMapping
    public ResponseEntity<?> create(@Valid @RequestBody CobroRequestDTO dto,
                                    @AuthenticationPrincipal UserDetails userDetails) {
        try {
            return ResponseEntity.ok(cobroService.create(dto, userDetails.getUsername()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
        }
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        cobroService.delete(id);
        return ResponseEntity.noContent().build();
    }
}