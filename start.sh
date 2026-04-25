#!/bin/bash
# Start the Glass Edition server

cd /home/jeyanth-mandava/local-news

# Kill any existing node processes
pkill -9 -f "node.*server" 2>/dev/null
pkill -9 -f "node.*3000" 2>/dev/null
sleep 1

# Start server
node server.js &
SERVER_PID=$!

echo "Server starting with PID: $SERVER_PID"
sleep 3

# Test
echo "Testing..."
curl -s http://localhost:3000/api/health
echo ""
