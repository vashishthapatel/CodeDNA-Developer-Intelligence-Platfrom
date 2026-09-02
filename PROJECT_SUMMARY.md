# CodeDNA - Complete Full-Stack Application

## 🎯 Project Overview

**CodeDNA** is an AI-powered Developer Intelligence Platform that transforms GitHub activity into measurable Developer DNA scores. The platform analyzes repositories, commits, and coding patterns to generate personalized skill profiles and recommendations.

---

## 📁 Project Structure

```
Code-DNA/
├── frontend/                    # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/         # 16 UI components
│   │   ├── pages/              # 4 main pages
│   │   ├── lib/                # Types and mock data
│   │   └── App.tsx
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
│
└── backend/                     # Spring Boot Microservices
    ├── common/                  # Shared DTOs and models
    ├── auth-service/            # Port 8081
    ├── repository-service/      # Port 8082
    ├── analytics-service/       # Port 8083
    ├── scoring-engine/          # Port 8084
    ├── recommendation-engine/   # Port 8085
    ├── api-gateway/            # Port 8080
    ├── docker-compose.yml
    └── pom.xml
```

---

## 🏗️ Architecture

```
                 ┌───────────────────┐
                 │     CodeDNA       │
                 └─────────┬─────────┘
                           │
                     React Frontend
                           │
                    Spring Boot API
                           │
       ┌───────────────────┼───────────────────┐
       ↓                   ↓                   ↓
 Authentication       Repository           Analytics
   Service             Service               Service
       │                   │                   │
       │              GitHub API               │
       │                   │                   │
       └───────────────────┼───────────────────┘
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

---

## 🎨 Frontend - React Application

### Tech Stack
- **Framework**: React 18.3.1
- **Language**: TypeScript 5.5.4
- **Build Tool**: Vite 5.4.3
- **Styling**: Tailwind CSS 3.4.11
- **Routing**: React Router DOM 6.26.2
- **Charts**: Recharts 2.12.7
- **Icons**: Lucide React 0.417.0

### Pages
1. **Dashboard** (`/`) - Overview with DNA score, skills, activity heatmap
2. **Repositories** (`/repositories`) - All repositories with health metrics
3. **Analytics** (`/analytics`) - Charts and insights
4. **Recommendations** (`/recommendations`) - AI-powered skill suggestions

### Key Components
- `Layout`, `Sidebar`, `Header` - App structure
- `StatCard`, `SkillBar`, `DnaRadar` - Data visualization
- `ActivityChart`, `LanguagePie`, `QualityChart`, `ComplexityChart` - Recharts
- `RepoCard`, `RecommendationCard` - Content cards
- `ActivityHeatmap` - GitHub-style contribution grid
- `CollaborationStats` - Team metrics

### Design System
- **Colors**: Dark theme with purple accents (#8B5CF6, #6366F1)
- **Typography**: Inter + JetBrains Mono
- **Animations**: Fade-up, float, shimmer, pulse-glow
- **Components**: Card, glass, chip, text-gradient utilities

---

## ⚙️ Backend - Spring Boot Microservices

### Tech Stack
- **Framework**: Spring Boot 3.2.5
- **Java**: 21
- **Database**: PostgreSQL 16
- **Message Queue**: Apache Kafka 3.6.1
- **Cache**: Redis 7
- **Security**: Spring Security + JWT
- **API Gateway**: Spring Cloud Gateway
- **WebSocket**: STOMP over SockJS

---

## 🔐 1. Auth Service (Port 8081)

### Features
- User registration and login
- JWT token generation (24-hour expiration)
- BCrypt password hashing
- GitHub OAuth integration ready

### Endpoints
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - User login
- `GET /api/v1/auth/me` - Get current user
- `GET /api/v1/auth/users/{userId}` - Get user by ID

### Database: `codedna_auth`
- **Table**: `users`
- Fields: id, name, email, password, handle, title, bio, avatar_url, location, company, github_connected, github_username, github_access_token

---

## 📦 2. Repository Service (Port 8082)

### Features
- Sync GitHub repositories via GitHub API
- Fetch commits, languages, contributors
- Calculate repository health metrics
- Detect tech stack and patterns
- Publish `repository.synced` events to Kafka

### Endpoints
- `POST /api/v1/repositories/sync` - Sync GitHub repos
- `GET /api/v1/repositories/user/{userId}` - Get user repositories
- `GET /api/v1/repositories/{id}` - Get repository by ID

### GitHub API Integration
- Uses OpenFeign client
- Endpoints: `/user/repos`, `/repos/{owner}/{repo}/commits`, `/repos/{owner}/{repo}/languages`

### Database: `codedna_repository`
- **Table**: `repositories`
- Fields: id, user_id, name, full_name, description, primary_language, languages (JSONB), stars, forks, commits, pull_requests, issues, contributors, dna_contribution, visibility, health metrics, stack (JSONB), patterns (JSONB)

---

## 📊 3. Analytics Service (Port 8083)

### Features
- Generate comprehensive analytics
- Activity trends (commits, PRs)
- Language distribution
- Code quality trends
- Repository complexity analysis
- Contribution heatmap
- Collaboration statistics

### Endpoints
- `GET /api/v1/analytics/user/{userId}` - Get user analytics
- `POST /api/v1/analytics/refresh/{userId}` - Refresh analytics

### No Database (Stateless)
- Fetches data from Repository Service
- Aggregates and transforms on-the-fly

---

## 🧬 4. Scoring Engine (Port 8084)

### Features
- Calculate Developer DNA score (0-100)
- Analyze language proficiency
- Measure engineering skills
- Determine developer archetype
- Consume `repository.synced` events from Kafka
- Publish `dna.calculated` events to Kafka

### Endpoints
- `POST /api/v1/dna/calculate/{userId}` - Calculate DNA score
- `GET /api/v1/dna/user/{userId}` - Get DNA profile

### Scoring Algorithm
1. **Language Skills** - Based on commit frequency per language
2. **Engineering Skills** - Code quality, testing, documentation
3. **Overall Score** - 60% languages + 40% engineering
4. **Label** - Expert, Strong, Proficient, Intermediate, Junior
5. **Archetype** - Systems Builder, Full-Stack Creator, Generalist

### Database: `codedna_scoring`
- **Table**: `dna_profiles`
- Fields: id, user_id, score, label, strongest_area, recommended_skill, archetype, calculated_at

---

## 💡 5. Recommendation Engine (Port 8085)

### Features
- AI-powered skill recommendations
- Match score calculation (0-100)
- Difficulty levels (Beginner, Intermediate, Advanced)
- Learning path suggestions
- Consume `dna.calculated` events from Kafka

### Endpoints
- `POST /api/v1/recommendations/generate/{userId}` - Generate recommendations
- `GET /api/v1/recommendations/user/{userId}` - Get user recommendations

### Recommendation Categories
- **Architecture**: Distributed Systems, System Design
- **Infrastructure**: Kubernetes, Docker, CI/CD
- **Operations**: Observability, Monitoring, Logging

### Database: `codedna_recommendations`
- **Table**: `recommendations`
- Fields: id, user_id, title, reason, difficulty, duration, category, match_score, tags (JSONB)

---

## 🌐 6. API Gateway (Port 8080)

### Features
- Routes all requests to appropriate services
- JWT validation
- CORS configuration
- Rate limiting (Redis-based)
- WebSocket support for real-time notifications
- Broadcasts DNA updates via WebSocket

### Routes
- `/api/v1/auth/**` → Auth Service (8081)
- `/api/v1/repositories/**` → Repository Service (8082)
- `/api/v1/analytics/**` → Analytics Service (8083)
- `/api/v1/dna/**` → Scoring Engine (8084)
- `/api/v1/recommendations/**` → Recommendation Engine (8085)
- `/ws` → WebSocket endpoint

### WebSocket Topics
- `/topic/user/{userId}/dna` - DNA score updates
- `/topic/notifications` - System notifications

---

## 🔄 Kafka Event Flow

### Topics

1. **repository.synced**
   - Published by: Repository Service
   - Consumed by: Scoring Engine
   - Payload: `RepositorySyncedEvent`
   - Triggers: DNA score calculation

2. **dna.calculated**
   - Published by: Scoring Engine
   - Consumed by: Recommendation Engine, API Gateway
   - Payload: `DnaCalculatedEvent`
   - Triggers: Recommendation generation, WebSocket broadcast

---

## 🚀 Getting Started

### Prerequisites

```bash
# Required
- Java 21
- Maven 3.9+
- Node.js 18+
- PostgreSQL 16
- Apache Kafka 3.6+
- Redis 7+

# Optional
- Docker & Docker Compose
```

### Backend Setup

#### Option 1: Run with Docker (Recommended)

```bash
cd backend

# Build all services
./build.sh  # Unix
build.bat   # Windows

# Start all services
docker-compose up -d

# Check logs
docker-compose logs -f

# Stop all services
docker-compose down
```

#### Option 2: Run Locally

```bash
# 1. Start PostgreSQL, Kafka, Redis manually

# 2. Create databases
psql -U postgres -f init-databases.sql

# 3. Build parent
cd backend
mvn clean install -DskipTests

# 4. Start each service (in separate terminals)
cd auth-service && mvn spring-boot:run
cd repository-service && mvn spring-boot:run
cd analytics-service && mvn spring-boot:run
cd scoring-engine && mvn spring-boot:run
cd recommendation-engine && mvn spring-boot:run
cd api-gateway && mvn spring-boot:run
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Access Points

- **Frontend**: http://localhost:5173
- **API Gateway**: http://localhost:8080
- **Auth Service**: http://localhost:8081/swagger-ui.html
- **Repository Service**: http://localhost:8082/swagger-ui.html
- **Analytics Service**: http://localhost:8083/swagger-ui.html
- **Scoring Engine**: http://localhost:8084/swagger-ui.html
- **Recommendation Engine**: http://localhost:8085/swagger-ui.html

---

## 🔒 Security

### Authentication Flow

1. User registers/logs in via Auth Service
2. Auth Service returns JWT token
3. Frontend stores token in localStorage
4. All subsequent requests include `Authorization: Bearer <token>`
5. API Gateway validates JWT before routing
6. Services receive user info via headers

### JWT Configuration

```properties
jwt.secret=codedna-super-secret-key-change-in-production-minimum-256-bits
jwt.expiration=86400000  # 24 hours
```

---

## 📝 API Usage Examples

### 1. Register User

```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

### 2. Login

```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### 3. Sync Repositories

```bash
curl -X POST http://localhost:8080/api/v1/repositories/sync \
  -H "X-User-Id: 1" \
  -H "X-GitHub-Token: ghp_your_github_token"
```

### 4. Get Analytics

```bash
curl http://localhost:8080/api/v1/analytics/user/1
```

### 5. Get DNA Profile

```bash
curl http://localhost:8080/api/v1/dna/user/1
```

### 6. Get Recommendations

```bash
curl http://localhost:8080/api/v1/recommendations/user/1
```

---

## 🧪 Testing

```bash
# Backend - Run unit tests
cd backend
mvn test

# Backend - Run integration tests
mvn verify

# Frontend - Run tests
cd frontend
npm test

# Frontend - Type check
npm run typecheck
```

---

## 📦 Deployment

### Docker Images

```bash
# Build Docker images
docker-compose build

# Push to registry
docker tag codedna/auth-service:latest your-registry/auth-service:latest
docker push your-registry/auth-service:latest
```

### Environment Variables

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres

# Kafka
KAFKA_BOOTSTRAP_SERVERS=localhost:9092

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRATION=86400000

# GitHub
GITHUB_CLIENT_ID=your-client-id
GITHUB_CLIENT_SECRET=your-client-secret
```

---

## 🎯 Features Completed

### ✅ Frontend
- [x] Dashboard with DNA score visualization
- [x] Repository management with health metrics
- [x] Analytics charts and insights
- [x] Personalized recommendations
- [x] Responsive design (mobile, tablet, desktop)
- [x] Dark theme with custom design system
- [x] Activity heatmap
- [x] Skill radar charts

### ✅ Backend
- [x] User authentication with JWT
- [x] GitHub repository synchronization
- [x] Commit analysis
- [x] Language detection
- [x] DNA score calculation
- [x] Skill proficiency analysis
- [x] AI-powered recommendations
- [x] Real-time WebSocket notifications
- [x] Kafka event-driven architecture
- [x] PostgreSQL data persistence
- [x] Redis caching (rate limiting)
- [x] API Gateway with routing
- [x] Swagger API documentation
- [x] Docker containerization
- [x] Docker Compose orchestration

---

## 🔮 Future Enhancements

- [ ] GitHub OAuth integration
- [ ] Team analytics
- [ ] Code review insights
- [ ] Issue tracking analysis
- [ ] CI/CD pipeline metrics
- [ ] Machine learning-based recommendations
- [ ] Social features (follow developers)
- [ ] Leaderboards
- [ ] Achievements and badges
- [ ] Export reports (PDF)
- [ ] Email notifications
- [ ] Mobile app (React Native)

---

## 📄 License

MIT License - feel free to use this project for learning and commercial purposes.

---

## 👥 Contributors

Built with ❤️ by the CodeDNA team

---

## 📚 Documentation

- **API Docs**: Available at each service's `/swagger-ui.html`
- **Architecture**: See [backend/README.md](backend/README.md)
- **Frontend**: See component documentation in code

---

**🎉 Project Complete! Ready for development and deployment.**
