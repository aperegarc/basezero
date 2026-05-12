package com.basezero.basezero;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class BasezeroApplication {

    public static void main(String[] args) {
        SpringApplication.run(BasezeroApplication.class, args);
    }
}
