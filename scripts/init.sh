#!/bin/bash
# Development server startup script for EscapeTwogether
echo "Starting EscapeTwogether development server..."
echo "Frontend: http://localhost:5173"

# Start SvelteKit dev server
npm run dev &
DEV_PID=$!

echo "Server started. Press Ctrl+C to stop."
echo "Dev PID: $DEV_PID"

# Handle shutdown
trap "kill $DEV_PID 2>/dev/null" EXIT

wait
