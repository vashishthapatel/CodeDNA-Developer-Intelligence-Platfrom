@echo off
echo ========================================
echo   CodeDNA - Starting Development Server
echo ========================================
echo.

echo Checking Node modules...
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
)

echo.
echo Starting Vite dev server...
echo.
echo Your application will be available at:
echo.
echo   Landing Page: http://localhost:5173/
echo   Dashboard:    http://localhost:5173/app.html
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

call npm run dev
