from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging

from app.config import settings, validate_startup_config
from app.api import api_router
from app.ml.model_manager import model_manager
from app.middleware.rate_limiter import RateLimitMiddleware

logging.basicConfig(level=getattr(logging, settings.LOG_LEVEL if hasattr(settings, "LOG_LEVEL") else "INFO", logging.INFO))
logger = logging.getLogger("jatayu")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing Jatayu AI backend...")

    # Validate startup configuration (raises RuntimeError in production for missing secrets)
    try:
        validate_startup_config()
    except RuntimeError as e:
        logger.critical(f"STARTUP CONFIGURATION ERROR: {e}")
        raise

    # Initialize ML models on startup
    try:
        model_manager.initialize()
    except Exception as e:
        logger.warning(f"ML models could not be loaded: {e}. Fallback demo mode active.")

    yield
    logger.info("Jatayu backend shutting down.")


# In production: disable /docs and /redoc to avoid exposing API surface
_docs_url = None if settings.PRODUCTION_MODE else "/docs"
_redoc_url = None if settings.PRODUCTION_MODE else "/redoc"

app = FastAPI(
    title="Jatayu AI",
    description="Predictive Maintenance & Fleet Availability Intelligence Platform | Team TrackForce",
    version=settings.VERSION,
    lifespan=lifespan,
    docs_url=_docs_url,
    redoc_url=_redoc_url,
)

# --- Rate Limiting Middleware ---
# Applied before CORS so abusive requests are rejected early.
app.add_middleware(RateLimitMiddleware)

# --- CORS Middleware ---
# Wildcard '*' is intentionally excluded — incompatible with credentials.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)

# --- Mount API ---
app.include_router(api_router, prefix=settings.API_PREFIX)


# --- Security Headers Middleware ---
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), camera=(), microphone=()"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    if settings.PRODUCTION_MODE:
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response


# --- Root Endpoint ---
@app.get("/")
def root():
    return {
        "product": "Jatayu AI",
        "subtitle": "Predictive Maintenance & Fleet Availability Intelligence Platform",
        "team": "TrackForce",
        "status": "operational",
        "api_docs": "/docs" if not settings.PRODUCTION_MODE else "disabled",
        "data_provenance": (
            "Prototype uses public/synthetic aerospace data for demonstration. "
            "Real operational defence aircraft data is not used."
        ),
    }


# --- Global Exception Handler ---
# IMPORTANT: Only return generic messages to the client.
# Full exception details are logged server-side only.
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(
        f"Unhandled exception on {request.method} {request.url.path}: "
        f"{type(exc).__name__}: {exc}",
        exc_info=True,
    )
    return JSONResponse(
        status_code=500,
        content={
            "detail": "An internal server error occurred. Please try again or contact support."
        },
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.API_HOST, port=settings.API_PORT, reload=True)
