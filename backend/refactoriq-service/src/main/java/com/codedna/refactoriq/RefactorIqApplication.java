package com.codedna.refactoriq;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication
@EntityScan(basePackages = "com.codedna.refactoriq.entity")
@EnableJpaRepositories(basePackages = "com.codedna.refactoriq.repository")
public class RefactorIqApplication {

    public static void main(String[] args) {
        SpringApplication.run(RefactorIqApplication.class, args);
    }
}
