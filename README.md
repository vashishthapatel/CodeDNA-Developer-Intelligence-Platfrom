# CodeDNA - Quick Reference

## 🚀 Start Application

### Windows
```bash
start.bat
```

### Mac/Linux
```bash
./start.sh
```

### Manual Start
```bash
npm run dev
```

---

## 🌐 Your Working URLs

### ✅ ACTIVE NOW:
- **Landing Page**: http://localhost:5173/
- **Dashboard**: http://localhost:5173/app.html

---

## 📱 Quick Test

1. **Landing Page** - http://localhost:5173/
   - See hero section "Intelligence Designed To Evolve"
   - Watch animated stats counter
   - Click "Get Started" button

2. **Dashboard** - http://localhost:5173/app.html
   - DNA Score: 86 (Expert)
   - 47 repositories
   - View analytics charts
   - Explore recommendations

---

## 🔧 Switch to Backend

Edit `src/lib/dataService.ts` line 5:
```typescript
const USE_MOCK_DATA = false;  // Change from true
```

Start backend services:
```bash
cd backend
docker-compose up -d
```

---

## 📚 Documentation

- `WORKING_URLS.md` - Complete status & URLs
- `SETUP_GUIDE.md` - Full setup instructions
- `PROJECT_SUMMARY.md` - Architecture details
- `LOCALHOST_SETUP.md` - Quick start options

---

## ✅ Status

🟢 **Frontend**: WORKING with mock data
🟡 **Backend**: READY (docker-compose up -d)

**Current URLs are LIVE and WORKING!** 🎉
