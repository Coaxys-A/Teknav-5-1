#!/bin/bash

# Part 19 Feature Verification Script
# This script verifies that all Part 19 features are working correctly

set -e  # Exit on error

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_BASE_URL="http://localhost:3000"
OWNER_EMAIL="owner@example.com"
OWNER_PASSWORD="password"

# Test results
PASSED=0
FAILED=0

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
    ((PASSED++))
}

log_error() {
    echo -e "${RED}[FAILED]${NC} $1"
    ((FAILED++))
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# ============================================================================
# SETUP
# ============================================================================

log_info "Starting Part 19 Feature Verification..."
echo ""

# Check if backend is running
log_info "Checking if backend is running..."
if curl -s -f "$API_BASE_URL/health" > /dev/null; then
    log_success "Backend is running"
else
    log_error "Backend is not running. Please start the backend first."
    exit 1
fi

# Login as owner to get token
log_info "Logging in as owner..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\": \"$OWNER_EMAIL\", \"password\": \"$OWNER_PASSWORD\"}")

OWNER_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.accessToken')

if [ "$OWNER_TOKEN" == "null" ] || [ "$OWNER_TOKEN" == "" ]; then
    log_error "Failed to login as owner"
    exit 1
else
    log_success "Logged in as owner"
fi

echo ""

# ============================================================================
# QUEUE SYSTEM TESTS
# ============================================================================

log_info "Testing Queue System..."
echo ""

# Test 1: Get Queue Summary
log_info "Test 1: Get Queue Summary"
RESPONSE=$(curl -s -X GET "$API_BASE_URL/owner/queues" \
    -H "Authorization: Bearer $OWNER_TOKEN")

if [ "$(echo $RESPONSE | jq '.data')" != "null" ]; then
    QUEUE_COUNT=$(echo $RESPONSE | jq '.data | length')
    if [ "$QUEUE_COUNT" -ge 6 ]; then
        log_success "Queue summary returned ($QUEUE_COUNT queues)"
    else
        log_warning "Queue summary returned only $QUEUE_COUNT queues (expected 6)"
    fi
else
    log_error "Failed to get queue summary"
fi

# Test 2: Get Queue Stats
log_info "Test 2: Get Queue Stats"
RESPONSE=$(curl -s -X GET "$API_BASE_URL/owner/queues/stats" \
    -H "Authorization: Bearer $OWNER_TOKEN")

if [ "$(echo $RESPONSE | jq '.data')" != "null" ]; then
    log_success "Queue stats returned"
else
    log_error "Failed to get queue stats"
fi

# Test 3: Get Queue Metrics
log_info "Test 3: Get Queue Metrics"
RESPONSE=$(curl -s -X GET "$API_BASE_URL/owner/queues/metrics" \
    -H "Authorization: Bearer $OWNER_TOKEN")

if [ "$(echo $RESPONSE | jq '.data')" != "null" ]; then
    log_success "Queue metrics returned"
else
    log_error "Failed to get queue metrics"
fi

# Test 4: Get Queue Health
log_info "Test 4: Get Queue Health"
RESPONSE=$(curl -s -X GET "$API_BASE_URL/owner/queues/health" \
    -H "Authorization: Bearer $OWNER_TOKEN")

if [ "$(echo $RESPONSE | jq '.data')" != "null" ]; then
    log_success "Queue health returned"
else
    log_error "Failed to get queue health"
fi

# Test 5: Enqueue AI Job
log_info "Test 5: Enqueue AI Content Generate Job"
RESPONSE=$(curl -s -X POST "$API_BASE_URL/api/ai/content/generate" \
    -H "Authorization: Bearer $OWNER_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "articleId": 9999,
        "workspaceId": 1,
        "tenantId": 1,
        "actorId": 1
    }')

JOB_ID=$(echo $RESPONSE | jq -r '.jobId')

if [ "$JOB_ID" != "null" ] && [ "$JOB_ID" != "" ]; then
    if [[ $JOB_ID == ai.content:* ]]; then
        log_success "AI job enqueued (Job ID: $JOB_ID)"
    else
        log_warning "AI job enqueued but ID format unexpected: $JOB_ID"
    fi
else
    log_error "Failed to enqueue AI job"
fi

# Wait for job to process
sleep 3

# Test 6: Check Job in Queue
log_info "Test 6: Check AI Queue Jobs"
RESPONSE=$(curl -s -X GET "$API_BASE_URL/owner/queues/queue:ai/jobs?state=waiting&pageSize=10" \
    -H "Authorization: Bearer $OWNER_TOKEN")

if [ "$(echo $RESPONSE | jq '.data')" != "null" ]; then
    log_success "AI queue jobs returned"
else
    log_error "Failed to get AI queue jobs"
fi

echo ""

# ============================================================================
# DLQ TESTS
# ============================================================================

log_info "Testing DLQ System..."
echo ""

# Test 7: Get DLQ Jobs
log_info "Test 7: Get DLQ Jobs"
RESPONSE=$(curl -s -X GET "$API_BASE_URL/owner/queues/dlq" \
    -H "Authorization: Bearer $OWNER_TOKEN")

if [ "$(echo $RESPONSE | jq '.data')" != "null" ]; then
    DLQ_COUNT=$(echo $RESPONSE | jq '.data | length')
    log_success "DLQ jobs returned ($DLQ_COUNT jobs)"
else
    log_error "Failed to get DLQ jobs"
fi

# Test 8: Get DLQ Analytics
log_info "Test 8: Get DLQ Analytics"
RESPONSE=$(curl -s -X GET "$API_BASE_URL/owner/queues/dlq/analytics" \
    -H "Authorization: Bearer $OWNER_TOKEN")

if [ "$(echo $RESPONSE | jq '.data')" != "null" ]; then
    log_success "DLQ analytics returned"
else
    log_error "Failed to get DLQ analytics"
fi

# Test 9: Get DLQ Trends
log_info "Test 9: Get DLQ Trends"
RESPONSE=$(curl -s -X GET "$API_BASE_URL/owner/queues/dlq/trends?hours=24" \
    -H "Authorization: Bearer $OWNER_TOKEN")

if [ "$(echo $RESPONSE | jq '.data')" != "null" ]; then
    log_success "DLQ trends returned"
else
    log_error "Failed to get DLQ trends"
fi

# Test 10: Test DLQ Clear Without Confirm
log_info "Test 10: Test DLQ Clear Without Confirm (should fail)"
RESPONSE=$(curl -s -X POST "$API_BASE_URL/owner/queues/dlq/clear" \
    -H "Authorization: Bearer $OWNER_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{}')

ERROR_MSG=$(echo $RESPONSE | jq -r '.error')

if [ "$ERROR_MSG" == "Confirmation token required" ]; then
    log_success "DLQ clear without confirm correctly rejected"
else
    log_error "DLQ clear without confirm should have been rejected"
fi

# Test 11: Test DLQ Clear With Wrong Confirm
log_info "Test 11: Test DLQ Clear With Wrong Confirm (should fail)"
RESPONSE=$(curl -s -X POST "$API_BASE_URL/owner/queues/dlq/clear" \
    -H "Authorization: Bearer $OWNER_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"confirmToken": "WRONG_TOKEN"}')

ERROR_MSG=$(echo $RESPONSE | jq -r '.error')

if [ "$ERROR_MSG" == "Confirmation token required" ]; then
    log_success "DLQ clear with wrong confirm correctly rejected"
else
    log_error "DLQ clear with wrong confirm should have been rejected"
fi

echo ""

# ============================================================================
# QUEUE CONTROL TESTS
# ============================================================================

log_info "Testing Queue Control..."
echo ""

# Test 12: Pause AI Queue
log_info "Test 12: Pause AI Queue"
RESPONSE=$(curl -s -X POST "$API_BASE_URL/owner/queues/queue:ai/pause" \
    -H "Authorization: Bearer $OWNER_TOKEN")

if [ "$(echo $RESPONSE | jq '.data.message')" != "null" ]; then
    log_success "AI queue paused"
else
    log_error "Failed to pause AI queue"
fi

# Test 13: Check Queue is Paused
log_info "Test 13: Check AI Queue is Paused"
RESPONSE=$(curl -s -X GET "$API_BASE_URL/owner/queues/queue:ai/metrics" \
    -H "Authorization: Bearer $OWNER_TOKEN")

PAUSED=$(echo $RESPONSE | jq -r '.data.metrics.paused')

if [ "$PAUSED" == "true" ]; then
    log_success "AI queue is paused"
else
    log_error "AI queue should be paused"
fi

# Test 14: Resume AI Queue
log_info "Test 14: Resume AI Queue"
RESPONSE=$(curl -s -X POST "$API_BASE_URL/owner/queues/queue:ai/resume" \
    -H "Authorization: Bearer $OWNER_TOKEN")

if [ "$(echo $RESPONSE | jq '.data.message')" != "null" ]; then
    log_success "AI queue resumed"
else
    log_error "Failed to resume AI queue"
fi

# Test 15: Check Queue is Resumed
log_info "Test 15: Check AI Queue is Resumed"
RESPONSE=$(curl -s -X GET "$API_BASE_URL/owner/queues/queue:ai/metrics" \
    -H "Authorization: Bearer $OWNER_TOKEN")

PAUSED=$(echo $RESPONSE | jq -r '.data.metrics.paused')

if [ "$PAUSED" == "false" ]; then
    log_success "AI queue is resumed"
else
    log_error "AI queue should be resumed"
fi

# Test 16: Test Queue Purge Without Confirm
log_info "Test 16: Test Queue Purge Without Confirm (should fail)"
RESPONSE=$(curl -s -X POST "$API_BASE_URL/owner/queues/purge" \
    -H "Authorization: Bearer $OWNER_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "queueName": "queue:ai"
    }')

ERROR_MSG=$(echo $RESPONSE | jq -r '.error')

if [ "$ERROR_MSG" == "Confirmation token required" ]; then
    log_success "Queue purge without confirm correctly rejected"
else
    log_error "Queue purge without confirm should have been rejected"
fi

echo ""

# ============================================================================
# RBAC TESTS
# ============================================================================

log_info "Testing RBAC..."
echo ""

# Test 17: Unauthorized Access (No Token)
log_info "Test 17: Unauthorized Access (No Token)"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$API_BASE_URL/owner/queues")

if [ "$STATUS" == "401" ]; then
    log_success "Unauthorized access correctly blocked (401)"
else
    log_error "Unauthorized access should return 401, got $STATUS"
fi

# Test 18: Invalid Token
log_info "Test 18: Invalid Token"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$API_BASE_URL/owner/queues" \
    -H "Authorization: Bearer invalid")

if [ "$STATUS" == "401" ]; then
    log_success "Invalid token correctly rejected (401)"
else
    log_error "Invalid token should return 401, got $STATUS"
fi

echo ""

# ============================================================================
# PERFORMANCE TESTS
# ============================================================================

log_info "Testing Performance..."
echo ""

# Test 19: Queue Stats Response Time
log_info "Test 19: Queue Stats Response Time (should be < 100ms)"
START=$(date +%s%N)
curl -s -X GET "$API_BASE_URL/owner/queues/stats" \
    -H "Authorization: Bearer $OWNER_TOKEN" > /dev/null
END=$(date +%s%N)
LATENCY=$(( ($END - $START) / 1000000 ))

if [ "$LATENCY" -lt 100 ]; then
    log_success "Queue stats response time: ${LATENCY}ms (< 100ms)"
else
    log_warning "Queue stats response time: ${LATENCY}ms (expected < 100ms)"
fi

# Test 20: Queue Metrics Response Time
log_info "Test 20: Queue Metrics Response Time (should be < 100ms)"
START=$(date +%s%N)
curl -s -X GET "$API_BASE_URL/owner/queues/metrics" \
    -H "Authorization: Bearer $OWNER_TOKEN" > /dev/null
END=$(date +%s%N)
LATENCY=$(( ($END - $START) / 1000000 ))

if [ "$LATENCY" -lt 100 ]; then
    log_success "Queue metrics response time: ${LATENCY}ms (< 100ms)"
else
    log_warning "Queue metrics response time: ${LATENCY}ms (expected < 100ms)"
fi

echo ""

# ============================================================================
# RESULTS SUMMARY
# ============================================================================

log_info "Test Results Summary:"
echo ""

TOTAL=$((PASSED + FAILED))

if [ "$FAILED" -eq 0 ]; then
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}✅ ALL TESTS PASSED! ($PASSED/$TOTAL)${NC}"
    echo -e "${GREEN}========================================${NC}"
    exit 0
else
    echo -e "${RED}========================================${NC}"
    echo -e "${RED}❌ SOME TESTS FAILED ($PASSED/$TOTAL passed, $FAILED failed)${NC}"
    echo -e "${RED}========================================${NC}"
    echo ""
    log_info "Please check the logs above for details on failed tests."
    exit 1
fi
