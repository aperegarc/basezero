package com.basezero.basezero;

import com.basezero.basezero.entity.Usuario;
import com.basezero.basezero.enums.Rol;
import com.basezero.basezero.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@EnableScheduling
@RequiredArgsConstructor
public class BasezeroApplication {

	public static void main(String[] args) {
		SpringApplication.run(BasezeroApplication.class, args);
	}
}