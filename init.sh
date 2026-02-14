#!/bin/bash
# Development server startup script
echo "Starting EscapeTwogether development servers..."
echo "Frontend: http://localhost:5173"
echo "Backend: http://localhost:3001"

# Start backend server in background
cd backend && npm run dev &
BACKEND_PID=$!

# Start frontend dev server
cd ../ && npm run dev &
FRONTEND_PID=$!

echo "Servers started. Press Ctrl+C to stop both."
echo "Frontend PID: $FRONTEND_PID"
echo "Backend PID: $BACKEND_PID"

# Handle shutdown
trap "kill $FRONTEND_PID $BACKEND_PID 2>/dev/null" EXIT

wait
