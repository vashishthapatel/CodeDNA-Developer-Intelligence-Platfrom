@echo off
echo Building all CodeDNA microservices...

echo Building parent...
call mvn clean install -DskipTests

set services=common auth-service repository-service analytics-service scoring-engine recommendation-engine api-gateway

for %%s in (%services%) do (
    echo Building %%s...
    cd %%s
    call mvn clean package -DskipTests
    cd ..
)

echo All services built successfully!
echo.
echo To run with Docker:
echo   docker-compose up -d
echo.
echo To run locally:
echo   Start each service manually from their directories
echo   mvn spring-boot:run
