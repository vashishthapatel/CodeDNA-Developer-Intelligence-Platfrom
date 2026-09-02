package com.codedna.repository;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.kafka.annotation.EnableKafka;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableFeignClients
@EnableKafka
@EnableAsync
public class RepositoryServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(RepositoryServiceApplication.class, args);
    }
}
