package com.basezero.basezero.service;

import com.basezero.basezero.dto.cliente.ClienteRequestDTO;
import com.basezero.basezero.dto.cliente.ClienteResponseDTO;
import com.basezero.basezero.entity.Cliente;
import com.basezero.basezero.entity.Empresa;
import com.basezero.basezero.repository.ClienteRepository;
import com.basezero.basezero.repository.EmpresaRepository;
import com.basezero.basezero.security.EmpresaContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ClienteService {

    private final ClienteRepository clienteRepository;
    private final EmpresaRepository empresaRepository;

    public ClienteService(ClienteRepository clienteRepository,
                          EmpresaRepository empresaRepository) {
        this.clienteRepository = clienteRepository;
        this.empresaRepository = empresaRepository;
    }

    @Transactional(readOnly = true)
    public List<ClienteResponseDTO> findAll() {
        return clienteRepository.findByEmpresaId(EmpresaContext.getEmpresaId())
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ClienteResponseDTO findById(Long id) {
        Cliente cliente = clienteRepository.findById(id)
                .filter(c -> c.getEmpresa().getId().equals(EmpresaContext.getEmpresaId()))
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));
        return toDTO(cliente);
    }

    @Transactional
    public ClienteResponseDTO create(ClienteRequestDTO dto) {
        Empresa empresa = empresaRepository.findById(EmpresaContext.getEmpresaId())
                .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));

        Cliente cliente = new Cliente();
        cliente.setNombre(dto.getNombre());
        cliente.setCifNif(dto.getCifNif());
        cliente.setTipo(dto.getTipo());
        cliente.setPersonaContacto(dto.getPersonaContacto());
        cliente.setCargo(dto.getCargo());
        cliente.setTelefono(dto.getTelefono());
        cliente.setEmail(dto.getEmail());
        cliente.setDireccion(dto.getDireccion());
        cliente.setEmpresa(empresa);

        return toDTO(clienteRepository.save(cliente));
    }

    @Transactional
    public ClienteResponseDTO update(Long id, ClienteRequestDTO dto) {
        Cliente cliente = clienteRepository.findById(id)
                .filter(c -> c.getEmpresa().getId().equals(EmpresaContext.getEmpresaId()))
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));

        cliente.setNombre(dto.getNombre());
        cliente.setCifNif(dto.getCifNif());
        cliente.setTipo(dto.getTipo());
        cliente.setPersonaContacto(dto.getPersonaContacto());
        cliente.setCargo(dto.getCargo());
        cliente.setTelefono(dto.getTelefono());
        cliente.setEmail(dto.getEmail());
        cliente.setDireccion(dto.getDireccion());

        return toDTO(clienteRepository.save(cliente));
    }

    @Transactional
    public void delete(Long id) {
        Cliente cliente = clienteRepository.findById(id)
                .filter(c -> c.getEmpresa().getId().equals(EmpresaContext.getEmpresaId()))
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));
        clienteRepository.delete(cliente);
    }

    private ClienteResponseDTO toDTO(Cliente c) {
        return new ClienteResponseDTO(
                c.getId(), c.getNombre(), c.getCifNif(), c.getTipo(),
                c.getPersonaContacto(), c.getCargo(), c.getTelefono(),
                c.getEmail(), c.getDireccion()
        );
    }
}
