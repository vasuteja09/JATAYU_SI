from fastapi import APIRouter, Depends

from app.auth import require_auth
from app.api.auth_router import router as auth_router
from app.api.health import router as health_router
from app.api.dashboard import router as dashboard_router
from app.api.fleet import router as fleet_router
from app.api.aircraft import router as aircraft_router
from app.api.predictions import router as predictions_router
from app.api.maintenance import router as maintenance_router
from app.api.spares import router as spares_router
from app.api.simulation import router as simulation_router
from app.api.alerts import router as alerts_router
from app.api.models_perf import router as models_perf_router
from app.api.copilot import router as copilot_router

api_router = APIRouter()

# Public routes (no auth required)
api_router.include_router(auth_router)   # /api/auth/login
api_router.include_router(health_router) # /api/health — health probe for uptime monitoring

# Protected routes — require valid JWT
_auth = [Depends(require_auth)]
api_router.include_router(dashboard_router, dependencies=_auth)
api_router.include_router(fleet_router, dependencies=_auth)
api_router.include_router(aircraft_router, dependencies=_auth)
api_router.include_router(predictions_router, dependencies=_auth)
api_router.include_router(maintenance_router, dependencies=_auth)
api_router.include_router(spares_router, dependencies=_auth)
api_router.include_router(simulation_router, dependencies=_auth)
api_router.include_router(alerts_router, dependencies=_auth)
api_router.include_router(models_perf_router, dependencies=_auth)
api_router.include_router(copilot_router, dependencies=_auth)
