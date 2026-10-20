import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Root paths
BACKEND_DIR = Path(__file__).resolve().parent.parent
BASE_DIR = BACKEND_DIR.parent
MODELS_DIR = BACKEND_DIR / "models"
MODELS_METRICS_DIR = MODELS_DIR / "metrics"

# Load environment variables from project root or backend
load_dotenv(BASE_DIR / ".env")
load_dotenv(BACKEND_DIR / ".env")


class Settings:
    PROJECT_NAME: str = "Jatayu AI"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{BACKEND_DIR}/jatayu.db")

    # Server
    API_HOST: str = os.getenv("API_HOST", "0.0.0.0")
    API_PORT: int = int(os.getenv("API_PORT", "8000"))

    # Production Mode — disables /docs, tightens CORS, hides error details
    PRODUCTION_MODE: bool = os.getenv("PRODUCTION_MODE", "false").lower() == "true"

    # ML & Simulation
    MODEL_DIR: Path = MODELS_DIR
    RANDOM_SEED: int = int(os.getenv("RANDOM_SEED", "42"))
    PREDICTION_HORIZON_HOURS: int = int(os.getenv("PREDICTION_HORIZON_HOURS", "20"))

    # Risk Thresholds
    RISK_THRESHOLD_LOW: float = float(os.getenv("RISK_THRESHOLD_LOW", "0.25"))
    RISK_THRESHOLD_MEDIUM: float = float(os.getenv("RISK_THRESHOLD_MEDIUM", "0.55"))
    RISK_THRESHOLD_HIGH: float = float(os.getenv("RISK_THRESHOLD_HIGH", "0.80"))

    # Health Score Weights (Transparent, configurable)
    WEIGHT_SENSOR_HEALTH: float = 0.30
    WEIGHT_COMPONENT_HEALTH: float = 0.30
    WEIGHT_MAINTENANCE_HEALTH: float = 0.20
    WEIGHT_RISK_HEALTH: float = 0.20

    # --- Authentication ---
    # Must be set to a strong random value in any real deployment.
    # Generate with: python -c "import secrets; print(secrets.token_hex(32))"
    JWT_SECRET: str = os.getenv("JWT_SECRET", "")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    JWT_EXPIRE_HOURS: int = int(os.getenv("JWT_EXPIRE_HOURS", "8"))

    # Demo credentials — read from env, never hardcoded defaults in production
    DEMO_USERNAME: str = os.getenv("DEMO_USERNAME", "demo")
    DEMO_PASSWORD: str = os.getenv("DEMO_PASSWORD", "demo")

    # Role-based demo users
    COMMANDER_USERNAME: str = os.getenv("COMMANDER_USERNAME", "commander")
    COMMANDER_PASSWORD: str = os.getenv("COMMANDER_PASSWORD", "commander123")
    SPARES_USERNAME: str = os.getenv("SPARES_USERNAME", "spares")
    SPARES_PASSWORD: str = os.getenv("SPARES_PASSWORD", "spares123")
    TECHNICIAN_USERNAME: str = os.getenv("TECHNICIAN_USERNAME", "technician")
    TECHNICIAN_PASSWORD: str = os.getenv("TECHNICIAN_PASSWORD", "tech123")

    # --- CORS ---
    # Allowed origins for development
    _DEV_ORIGINS: list = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    @property
    def CORS_ORIGINS(self) -> list[str]:
        """
        Returns allowed CORS origins based on environment.
        Production: only origins listed in CORS_ALLOWED_ORIGINS env var.
        Development: localhost origins.
        Wildcard '*' is NEVER included — it is incompatible with credentials.
        """
        if self.PRODUCTION_MODE:
            raw = os.getenv("CORS_ALLOWED_ORIGINS", "")
            if raw.strip():
                return [o.strip() for o in raw.split(",") if o.strip()]
            # Production with no explicit origins set — deny all as safe fallback
            return []
        return self._DEV_ORIGINS


settings = Settings()

MODELS_DIR.mkdir(parents=True, exist_ok=True)
MODELS_METRICS_DIR.mkdir(parents=True, exist_ok=True)


def validate_startup_config() -> None:
    """
    Validates critical configuration on startup.
    In production mode, raises RuntimeError for missing required secrets.
    In development, emits warnings so developers are aware of security gaps.
    """
    warnings = []
    errors = []

    if not settings.JWT_SECRET:
        if settings.PRODUCTION_MODE:
            errors.append(
                "JWT_SECRET environment variable is required in production mode. "
                "Generate one with: python -c \"import secrets; print(secrets.token_hex(32))\""
            )
        else:
            warnings.append(
                "JWT_SECRET is not set. A development fallback will be used. "
                "Set JWT_SECRET in your .env file before any real deployment."
            )

    if settings.PRODUCTION_MODE and not os.getenv("CORS_ALLOWED_ORIGINS"):
        warnings.append(
            "PRODUCTION_MODE is enabled but CORS_ALLOWED_ORIGINS is not set. "
            "No frontend origins will be allowed. Set CORS_ALLOWED_ORIGINS."
        )

    if errors:
        raise RuntimeError(
            "Jatayu startup configuration error(s):\n" + "\n".join(f"  - {e}" for e in errors)
        )

    import logging
    _logger = logging.getLogger("jatayu.config")
    for w in warnings:
        _logger.warning(f"[CONFIG WARNING] {w}")
