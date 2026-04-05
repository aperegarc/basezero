package com.basezero.basezero.repository;

import com.basezero.basezero.entity.Empresa;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface EmpresaRepository extends JpaRepository<Empresa, Long> {
    Optional<Empresa> findByEmail(String email);
    boolean existsByEmail(String email);
}