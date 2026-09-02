#!/bin/bash

echo "========================================"
echo "  CodeDNA - Starting Development Server"
echo "========================================"
echo ""

echo "Checking Node modules..."
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

echo ""
echo "Starting Vite dev server..."
echo ""
echo "Your application will be available at:"
echo ""
echo "  Landing Page: http://localhost:5173/"
echo "  Dashboard:    http://localhost:5173/app.html"
echo ""
echo "Press Ctrl+C to stop the server"
echo "========================================"
echo ""

npm run dev
