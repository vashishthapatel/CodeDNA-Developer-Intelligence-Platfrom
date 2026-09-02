# CodeDNA Backend

AI-powered Developer Intelligence Platform - Backend Microservices

## Architecture

```
┌───────────────────┐
│     CodeDNA       │
└─────────┬─────────┘
          │
    React Frontend
          │
   Spring Boot API
          │
┌─────────┼─────────────────┐
↓         ↓                 ↓
Auth    Repository      Analytics
Service  Service         Service
│         │                 │
│    GitHub API             │
│         │                 │
└─────────┼─────────────────┘
          ↓
       Kafka
          ↓
   Scoring Engine
          ↓
  Developer DNA
          ↓
Recommendation Engine
          ↓
    WebSocket
          ↓
  React Dashboard
```

## Microservices

### 1. **API Gateway** (Port: 8080)
- Routes all requests to appropriate services
- JWT validation
- Rate limiting
- CORS configuration

### 2. **Auth Service** (Port: 8081)
- User registration and login
- JWT token generation
- GitHub OAuth integration
- Password encryption (BCrypt)

### 3. **Repository Service** (Port: 8082)
- Sync GitHub repositories
- Fetch commit history
- Analyze code patterns
- Store repository metadata

### 4. **Analytics Service** (Port: 8083)
- Generate activity statistics
- Language distribution analysis
- Code quality metrics
- Collaboration insights

### 5. **Scoring Engine** (Port: 8084)
- Calculate Developer DNA score
- Skill proficiency analysis
- Pattern recognition
- Kafka consumer for repository events

### 6. **Recommendation Engine** (Port: 8085)
- AI-powered skill recommendations
- Learning path generation
- Match score calculation
- Kafka consumer for DNA updates

### 7. **Common Module**
- Shared DTOs and models
- Kafka event definitions
- Utility classes
- Common configurations

## Tech Stack

- **Framework**: Spring Boot 3.2.5
- **Java**: 21
- **Database**: PostgreSQL (per service)
- **Message Queue**: Apache Kafka
- **Cache**: Redis
- **Real-time**: WebSocket (STOMP)
- **API Docs**: Swagger/OpenAPI 3.0
- **Security**: Spring Security + JWT
- **Cloud**: Spring Cloud Gateway

## Database Schema

Each service has its own PostgreSQL database:

- `codedna_auth` - User accounts and credentials
- `codedna_repository` - Repository metadata and commits
- `codedna_analytics` - Analytics and metrics
- `codedna_scoring` - DNA profiles and scores
- `codedna_recommendations` - Recommendations and suggestions

## Kafka Topics

- `repository.synced` - Repository sync completed
- `dna.calculated` - DNA score updated
- `recommendation.generated` - New recommendations ready
- `analytics.updated` - Analytics data refreshed

## Quick Start

### Prerequisites

- Java 21
- Maven 3.9+
- PostgreSQL 16
- Apache Kafka 3.6+
- Redis 7+

### Build All Services

```bash
cd backend
mvn clean install
```

### Run Individual Service

```bash
cd auth-service
mvn spring-boot:run
```

### Run with Docker Compose

```bash
docker-compose up -d
```

## Environment Variables

Each service requires:

```properties
DB_HOST=localhost
DB_PORT=5432
DB_NAME=codedna_<service>
DB_USER=postgres
DB_PASSWORD=postgres

KAFKA_BOOTSTRAP_SERVERS=localhost:9092
REDIS_HOST=localhost
REDIS_PORT=6379

JWT_SECRET=your-secret-key
JWT_EXPIRATION=86400000

GITHUB_CLIENT_ID=your-client-id
GITHUB_CLIENT_SECRET=your-client-secret
```

## API Documentation

Once running, access Swagger UI at:
- Gateway: http://localhost:8080/swagger-ui.html
- Auth Service: http://localhost:8081/swagger-ui.html
- Repository Service: http://localhost:8082/swagger-ui.html
- Analytics Service: http://localhost:8083/swagger-ui.html
- Scoring Engine: http://localhost:8084/swagger-ui.html
- Recommendation Engine: http://localhost:8085/swagger-ui.html

## Development

### Code Style
- Follow Google Java Style Guide
- Use Lombok for boilerplate reduction
- Implement MapStruct for DTO mapping

### Testing
- JUnit 5 for unit tests
- Testcontainers for integration tests
- Minimum 80% code coverage

### CI/CD
- GitHub Actions for automated builds
- Docker images pushed to registry
- Kubernetes deployment manifests included

## License

MIT
