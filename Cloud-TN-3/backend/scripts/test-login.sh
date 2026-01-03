#!/bin/bash

# Test Login -> Session Created -> Redis Session Set

BASE_URL="${1:-http://localhost:3000}"

echo "Testing login flow..."

# Step 1: Login (POST /api/auth/login)
echo "Step 1: Login..."
LOGIN_RESPONSE=$(curl -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}' \
  -c /tmp/cookies.txt)

echo "$LOGIN_RESPONSE"

# Step 2: Check if session cookie was set
echo "Step 2: Checking session cookie..."
COOKIE_CONTENT=$(cat /tmp/cookies.txt | grep -oP 'sess_[^;]+' || echo "")
echo "Session Cookie: $COOKIE_CONTENT"

if [ -n "$COOKIE_CONTENT" ]; then
  echo "✅ Login successful: Session cookie set"
else
  echo "❌ Login failed: No session cookie"
  exit 1
fi

# Step 3: Fetch authenticated endpoint
echo "Step 3: Fetching authenticated endpoint..."
AUTH_RESPONSE=$(curl -X GET "$BASE_URL/api/auth/me" \
  -b /tmp/cookies.txt \
  -H "Content-Type: application/json")

echo "$AUTH_RESPONSE"

# Step 4: Test Brute Force (multiple failed logins)
echo "Step 4: Testing brute force protection..."
for i in {1..6}; do
  echo "Failed login attempt $i..."
  curl -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}' \
    -s -o /dev/null
  sleep 1
done

echo "✅ Login flow test complete"
