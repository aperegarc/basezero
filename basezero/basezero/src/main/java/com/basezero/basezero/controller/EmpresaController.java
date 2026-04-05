package com.basezero.basezero.controller;

import com.basezero.basezero.dto.empresa.RegistroEmpresaDTO;
import com.basezero.basezero.service.EmpresaService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/empresas")
public class EmpresaController {

    private final EmpresaService empresaService;

    public EmpresaController(EmpresaService empresaService) {
        this.empresaService = empresaService;
    }

    @PostMapping("/registro")
    public ResponseEntity<?> registro(@Valid @RequestBody RegistroEmpresaDTO dto) {
        try {
            empresaService.registrar(dto);
            return ResponseEntity.ok(Map.of("mensaje", "Empresa registrada correctamente"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}