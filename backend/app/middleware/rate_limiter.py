"""
Rate limiter middleware for Jatayu AI.

Implements a simple in-memory per-IP sliding-window rate limiter.
Uses no external packages — only Python stdlib (time, collections, threading).

Limits:
  - POST /api/predict/*          — 20 req/min  (ML inference, expensive)
  - POST /api/maintenance/optimize — 10 req/min  (CP-SAT solver, very expensive)
  - POST /api/simulation/*       — 30 req/min  (simulation steps)
  - POST /api/auth/login         — 10 req/min  (brute-force protection)
  - All other routes             — 120 req/min (general API)
"""

import time
import threading
from collections import defaultdict, deque
from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware


# Per-route limits: (max_requests, window_seconds)
ROUTE_LIMITS: dict[str, tuple[int, int]] = {
    "/api/auth/login":            (10, 60),
    "/api/predict/":              (20, 60),
    "/api/maintenance/optimize":  (10, 60),
    "/api/simulation/":           (30, 60),
}

# Default limit for all other routes
DEFAULT_LIMIT: tuple[int, int] = (120, 60)


class RateLimiter:
    """Thread-safe in-memory sliding-window rate limiter."""

    def __init__(self) -> None:
        # key: (ip, route_key) → deque of request timestamps
        self._windows: dict[tuple[str, str], deque] = defaultdict(deque)
        self._lock = threading.Lock()

    def _get_route_key_and_limit(self, path: str) -> tuple[str, int, int]:
        """Returns the matched route key, max_requests, and window_seconds."""
        for route_prefix, (max_req, window) in ROUTE_LIMITS.items():
            if path.startswith(route_prefix):
                return route_prefix, max_req, window
        return "default", DEFAULT_LIMIT[0], DEFAULT_LIMIT[1]

    def is_allowed(self, ip: str, path: str) -> tuple[bool, int]:
        """
        Returns (allowed: bool, retry_after_seconds: int).
        retry_after_seconds is 0 when allowed.
        """
        route_key, max_req, window = self._get_route_key_and_limit(path)
        now = time.monotonic()
        key = (ip, route_key)

        with self._lock:
            dq = self._windows[key]

            # Evict timestamps outside the sliding window
            cutoff = now - window
            while dq and dq[0] <= cutoff:
                dq.popleft()

            if len(dq) >= max_req:
                # Calculate when the oldest request will expire
                retry_after = int(window - (now - dq[0])) + 1
                return False, retry_after

            dq.append(now)
            return True, 0


# Singleton instance
_limiter = RateLimiter()


class RateLimitMiddleware(BaseHTTPMiddleware):
    """FastAPI middleware that applies per-IP rate limits to API routes."""

    async def dispatch(self, request: Request, call_next) -> Response:
        # Only rate-limit API routes
        path = request.url.path
        if not path.startswith("/api/"):
            return await call_next(request)

        # Extract client IP (respects X-Forwarded-For for proxy setups)
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            ip = forwarded_for.split(",")[0].strip()
        else:
            ip = request.client.host if request.client else "unknown"

        allowed, retry_after = _limiter.is_allowed(ip, path)

        if not allowed:
            return JSONResponse(
                status_code=429,
                content={
                    "detail": "Too many requests. Please slow down.",
                    "retry_after_seconds": retry_after,
                },
                headers={"Retry-After": str(retry_after)},
            )

        return await call_next(request)
