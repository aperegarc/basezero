package com.basezero.basezero.repository;

import com.basezero.basezero.entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    Optional<Usuario> findByEmail(String email);
    Optional<Usuario> findByUsername(String username);
    boolean existsByEmail(String email);
    boolean existsByUsername(String username);
    List<Usuario> findByEmpresaId(Long empresaId);

    /**
     * Carga el usuario junto con su empresa en una sola query (JOIN FETCH).
     * Necesario para que EmpresaContext.getEmpresaId() pueda acceder a empresa.getId()
     * desde el SecurityContextHolder sin lanzar LazyInitializationException.
     */
    @Query("SELECT u FROM Usuario u JOIN FETCH u.empresa WHERE u.email = :email")
    Optional<Usuario> findByEmailWithEmpresa(@Param("email") String email);
}