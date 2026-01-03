#!/bin/bash

# Test CSRF Token Fetch and Validation

BASE_URL="${1:-http://localhost:3000}"

echo "Testing CSRF flow..."

# Step 1: Fetch CSRF token (GET /api/auth/csrf)
echo "Step 1: Fetching CSRF token..."
CSRF_RESPONSE=$(curl -X GET "$BASE_URL/api/auth/csrf" \
  -c /tmp/cookies.txt \
  -H "Content-Type: application/json")

echo "$CSRF_RESPONSE"

# Extract CSRF token from response (assuming format: { "token": "..." })
TOKEN=$(echo "$CSRF_RESPONSE" | grep -oP '"token":"[^"]+' | sed 's/"token":"//')

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to fetch CSRF token"
  exit 1
fi

echo "CSRF Token: $TOKEN"

# Step 2: Try to make a mutation WITHOUT CSRF token (should fail)
echo "Step 2: Testing mutation without CSRF token (should fail)..."
NO_TOKEN_RESPONSE=$(curl -X POST "$BASE_URL/api/articles/1/like" \
  -b /tmp/cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"liked": true}')

echo "$NO_TOKEN_RESPONSE"

# Step 3: Make mutation WITH CSRF token (should succeed)
echo "Step 3: Testing mutation WITH CSRF token (should succeed)..."
WITH_TOKEN_RESPONSE=$(curl -X POST "$BASE_URL/api/articles/1/like" \
  -b /tmp/cookies.txt \
  -H "Content-Type: application/json" \
  -H "x-csrf-token: $TOKEN" \
  -d '{"liked": true}')

echo "$WITH_TOKEN_RESPONSE"

# Step 4: Test rate limit (multiple rapid requests)
echo "Step 4: Testing rate limit (rapid requests)..."
for i in {1..130}; do
  echo "Request $i..."
  RESPONSE=$(curl -X POST "$BASE_URL/api/articles/1/like" \
    -b /tmp/cookies.txt \
    -H "Content-Type: application/json" \
    -H "x-csrf-token: $TOKEN" \
    -d '{"liked": true}' \
    -s -o /dev/null -w "%{http_code}")
  if [ "$RESPONSE" = "429" ]; then
    echo "Rate limit hit at request $i"
    break
  fi
  sleep 0.05
done

echo "✅ CSRF flow test complete"
