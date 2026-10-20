"""
Authentication API router for Jatayu AI.
Provides the /api/auth/login endpoint.
"""

import logging
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, field_validator

from app.auth import verify_credentials, create_access_token

logger = logging.getLogger("jatayu.api.auth")

router = APIRouter(prefix="/auth", tags=["Authentication"])


class LoginRequest(BaseModel):
    username: str
    password: str

    @field_validator("username", "password")
    @classmethod
    def not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Field must not be empty.")
        if len(v) > 128:
            raise ValueError("Field exceeds maximum length.")
        return v


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in_hours: int
    username: str
    role: str  # 'demo' | 'commander' | 'spares' | 'technician'


@router.post(
    "/login",
    response_model=LoginResponse,
    summary="Authenticate and obtain a JWT access token",
)
def login(req: LoginRequest) -> LoginResponse:
    """
    Validates credentials and returns a signed JWT access token.

    - Passwords are compared using bcrypt — never stored or logged in plaintext.
    - Invalid credentials always return 401 (no user enumeration).
    - Rate limiting (10 req/min) is enforced by the middleware layer.
    - The returned 'role' field indicates the authenticated user's department.
    """
    from app.config import settings

    role = verify_credentials(req.username, req.password)
    if role is None:
        # Log failure without revealing which field was wrong
        logger.warning(f"Failed login attempt for username: '{req.username[:20]}'")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_access_token(req.username, role=role)
    logger.info(f"Successful login for user: '{req.username}' with role: '{role}'")

    return LoginResponse(
        access_token=token,
        token_type="bearer",
        expires_in_hours=settings.JWT_EXPIRE_HOURS,
        username=req.username,
        role=role,
    )
