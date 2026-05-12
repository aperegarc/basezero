package com.basezero.basezero.bootstrap;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@RequiredArgsConstructor
public class DevDataSeedRunnerConfig {

    private final DevDataSeedService devDataSeedService;

    @Bean
    ApplicationRunner devDataSeedApplicationRunner() {
        return args -> devDataSeedService.seedIfNeeded();
    }
}
