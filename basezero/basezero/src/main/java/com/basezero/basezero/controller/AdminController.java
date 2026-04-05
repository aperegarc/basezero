package com.basezero.basezero.controller;

import com.basezero.basezero.repository.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMINISTRADOR')")
public class AdminController {

    private final ClienteRepository clienteRepository;
    private final VentaRepository ventaRepository;
    private final CobroRepository cobroRepository;
    private final UsuarioRepository usuarioRepository;

    public AdminController(ClienteRepository clienteRepository, VentaRepository ventaRepository,
                           CobroRepository cobroRepository, UsuarioRepository usuarioRepository) {
        this.clienteRepository = clienteRepository;
        this.ventaRepository = ventaRepository;
        this.cobroRepository = cobroRepository;
        this.usuarioRepository = usuarioRepository;
    }

    @GetMapping("/resumen")
    public ResponseEntity<Map<String, Object>> resumen() {
        Map<String, Object> data = new HashMap<>();
        data.put("totalClientes", clienteRepository.count());
        data.put("totalVentas", ventaRepository.count());
        data.put("totalCobros", cobroRepository.count());
        data.put("totalUsuarios", usuarioRepository.count());
        data.put("ventasPendientes", ventaRepository.findByEstado(com.basezero.basezero.enums.EstadoVenta.PENDIENTE).size());
        data.put("ventasCobradas", ventaRepository.findByEstado(com.basezero.basezero.enums.EstadoVenta.COBRADO).size());
        return ResponseEntity.ok(data);
    }
}