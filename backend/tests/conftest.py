"""
Pytest conftest — applied to ALL backend tests.
Sets RATE_LIMIT_AUTH to a high value so login tests do not trip the
rate-limiter that shares a per-process in-memory store during the test run.
"""
import os

# Must be set BEFORE any app module imports because the limiter reads env
# at decoration time via a lambda, so runtime changes work correctly.
os.environ.setdefault("MOCK_EMAIL_DELIVERY", "true")
# Allow 1000 auth requests per minute in tests (no real rate-limiting risk)
os.environ.setdefault("RATE_LIMIT_AUTH", "1000/minute")
