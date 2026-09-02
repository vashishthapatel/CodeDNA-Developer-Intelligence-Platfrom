#!/bin/bash

echo "Building CodeDNA Backend Services..."

# Build parent POM first
echo "Building parent POM..."
mvn clean install -DskipTests

# Build each service
services=("common" "auth-service" "repository-service" "analytics-service" "scoring-engine" "recommendation-engine" "api-gateway")

for service in "${services[@]}"
do
    echo "Building $service..."
    cd $service
    mvn clean package -DskipTests
    cd ..
done

echo "All services built successfully!"
echo "Run 'docker-compose up -d' to start all services"
