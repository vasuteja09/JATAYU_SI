from fastapi import APIRouter
from app.config import settings

router = APIRouter(tags=["Health"])

@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "data_provenance": "Prototype uses public/synthetic aerospace data for demonstration. Real operational defence aircraft data is not used."
    }
