# 🚀 CodeDNA - Complete Setup Guide

## Overview
CodeDNA is a full-stack application with:
- **Landing Page**: Beautiful hero section (index.html)
- **React Dashboard**: Developer analytics platform (app.html)
- **Spring Boot Backend**: 7 microservices with Kafka, PostgreSQL, Redis

---

## 🎯 Quick Start Options

### Option 1: Frontend Only (Recommended for Quick Demo)
Run the frontend with mock data - **no backend needed!**

```bash
npm install
npm run dev
```

✅ **URLs**:
- Landing Page: http://localhost:5173/
- Dashboard App: http://localhost:5173/app.html

---

### Option 2: Full Stack with Docker (Production-like)

**Prerequisites**:
- Docker Desktop installed
- Java 21 (for building services)
- Maven 3.9+

**Steps**:

1. **Build Backend Services**:
```bash
cd backend
./build.sh   # On Unix/Mac
build.bat    # On Windows
```

2. **Start All Services with Docker**:
```bash
docker-compose up -d
```

This starts:
- PostgreSQL (port 5432)
- Kafka + Zookeeper (ports 9092, 2181)
- Redis (port 6379)
- 7 Spring Boot microservices (ports 8080-8085)

3. **Start Frontend**:
```bash
cd ..
npm install
npm run dev
```

4. **Access the Application**:
- Landing: http://localhost:5173/
- App: http://localhost:5173/app.html
- API Gateway: http://localhost:8080
- Swagger Docs: http://localhost:8081/swagger-ui.html (repeat for 8082-8085)

5. **Stop Everything**:
```bash
cd backend
docker-compose down
```

---

### Option 3: Manual Backend Setup (Development)

**Prerequisites**:
- Java 21
- Maven 3.9+
- PostgreSQL 16
- Apache Kafka 3.6+
- Redis 7+

**Steps**:

1. **Setup Databases**:
```bash
psql -U postgres -f backend/init-databases.sql
```

2. **Start Kafka** (in separate terminal):
```bash
# Start Zookeeper
bin/zookeeper-server-start.sh config/zookeeper.properties

# Start Kafka
bin/kafka-server-start.sh config/server.properties
```

3. **Start Redis** (in separate terminal):
```bash
redis-server
```

4. **Build Services**:
```bash
cd backend
mvn clean install -DskipTests
```

5. **Start Each Service** (in separate terminals):
```bash
cd backend/auth-service && mvn spring-boot:run
cd backend/repository-service && mvn spring-boot:run
cd backend/analytics-service && mvn spring-boot:run
cd backend/scoring-engine && mvn spring-boot:run
cd backend/recommendation-engine && mvn spring-boot:run
cd backend/api-gateway && mvn spring-boot:run
```

6. **Start Frontend**:
```bash
npm install
npm run dev
```

---

## 🔌 Connecting Frontend to Backend

By default, the frontend uses **mock data**. To connect to the real backend:

1. Open `src/lib/dataService.ts`
2. Change line 5:
```typescript
const USE_MOCK_DATA = false;  // Change from true to false
```

3. Restart the dev server:
```bash
npm run dev
```

Now the frontend will fetch data from your Spring Boot backend at `http://localhost:8080`

---

## 📱 How It Works

### Landing Page Flow
1. User visits http://localhost:5173/
2. Sees hero section "Intelligence Designed To Evolve"
3. Clicks "Get Started" button
4. Redirects to http://localhost:5173/app.html
5. Loads React dashboard application

### Dashboard Flow
1. User lands on `/app`
2. Sees Developer DNA score, repositories, analytics
3. Mock data shows:
   - DNA Score: 86
   - 47 repositories
   - Activity charts and heatmap
   - Personalized recommendations

### Backend Flow (when connected)
1. User registers/logs in via Auth Service
2. Connects GitHub account
3. Repository Service syncs GitHub repos via API
4. Scoring Engine calculates DNA score from code patterns
5. Recommendation Engine generates skill suggestions
6. Analytics Service provides charts and insights
7. WebSocket pushes real-time updates to frontend

---

## 🏗️ Architecture

```
Landing Page (index.html)
      ↓
   "Get Started" button
      ↓
React Dashboard (app.html → /app)
      ↓
   API Client (fetch)
      ↓
   API Gateway (port 8080)
      ↓
   ┌─────────────┼─────────────┐
   ↓             ↓             ↓
Auth        Repository     Analytics
(8081)       (8082)        (8083)
              ↓
         GitHub API
              ↓
          Kafka Events
              ↓
    Scoring Engine (8084)
              ↓
    Recommendation (8085)
              ↓
      WebSocket Updates
              ↓
      React Dashboard
```

---

## 🧪 Testing the Application

### Test Landing Page
1. Visit http://localhost:5173/
2. Check video background loads
3. Check stats counter animation
4. Click "Get Started" → should redirect to dashboard

### Test Dashboard (Mock Mode)
1. Visit http://localhost:5173/app.html
2. Navigate:
   - Dashboard → See DNA score 86
   - Repositories → See 7 repositories
   - Analytics → See charts
   - Recommendations → See 4 suggestions
3. All data should load instantly (mock data)

### Test Backend APIs (if running)
```bash
# Register a user
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Get repositories (use token from login)
curl http://localhost:8080/api/v1/repositories/user/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 🔧 Configuration Files

### Frontend Config
- `.env` - API endpoints
- `vite.config.ts` - Dev server proxy
- `src/lib/dataService.ts` - Mock/real data toggle

### Backend Config
- `backend/docker-compose.yml` - Docker orchestration
- `backend/*/application.properties` - Service configs
- `backend/init-databases.sql` - Database schemas

---

## 📊 Port Reference

| Service | Port | URL |
|---------|------|-----|
| Frontend Dev Server | 5173 | http://localhost:5173 |
| API Gateway | 8080 | http://localhost:8080 |
| Auth Service | 8081 | http://localhost:8081 |
| Repository Service | 8082 | http://localhost:8082 |
| Analytics Service | 8083 | http://localhost:8083 |
| Scoring Engine | 8084 | http://localhost:8084 |
| Recommendation Engine | 8085 | http://localhost:8085 |
| PostgreSQL | 5432 | localhost:5432 |
| Kafka | 9092 | localhost:9092 |
| Redis | 6379 | localhost:6379 |

---

## 🐛 Troubleshooting

### Frontend won't start
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Backend services won't start
```bash
# Check if ports are in use
netstat -ano | findstr :8080
netstat -ano | findstr :5432

# Kill process using port (Windows)
taskkill /PID <PID> /F

# Rebuild services
cd backend
mvn clean install -DskipTests
```

### Docker services won't start
```bash
# Check Docker is running
docker ps

# View logs
docker-compose logs -f

# Restart everything
docker-compose down
docker-compose up -d --build
```

### Can't connect to backend
1. Check backend is running: `curl http://localhost:8080/actuator/health`
2. Check `USE_MOCK_DATA = false` in `src/lib/dataService.ts`
3. Check browser console for CORS errors
4. Verify API Gateway is running on port 8080

---

## 🎨 Customization

### Change Landing Page Content
Edit `index.html`:
- Line 96-97: Headline text
- Line 101-103: Subheadline text
- Line 18: Background video URL

### Change Dashboard Theme
Edit `tailwind.config.js`:
- Colors
- Fonts
- Spacing

### Change API Endpoints
Edit `.env`:
```
VITE_API_BASE_URL=http://your-backend-url/api/v1
```

---

## 🚢 Deployment

### Frontend (Vercel/Netlify)
```bash
npm run build
# Upload dist/ folder
```

### Backend (Docker)
```bash
cd backend
docker-compose build
docker-compose push
# Deploy to cloud provider
```

---

## ✅ Success Checklist

- [ ] Landing page loads at http://localhost:5173/
- [ ] "Get Started" redirects to dashboard
- [ ] Dashboard shows DNA score and charts
- [ ] All navigation links work
- [ ] Responsive design works on mobile
- [ ] Backend services start (if testing full stack)
- [ ] API endpoints respond (if testing full stack)

---

## 🎉 You're All Set!

**Current Status**: Frontend working with mock data ✅

**Next Steps**:
1. Keep using mock data for frontend development
2. Start backend when you need real GitHub integration
3. Toggle `USE_MOCK_DATA = false` when backend is ready

Enjoy building with CodeDNA! 🧬
