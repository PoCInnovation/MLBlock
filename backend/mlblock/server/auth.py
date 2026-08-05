import os
import time

import requests
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError, jwk

security = HTTPBearer()

SUPABASE_JWKS_URL = os.environ.get("SUPABASE_JWKS_URL", "")
SUPABASE_JWT_SECRET = os.environ.get("SUPABASE_JWT_SECRET", "")

_jwks_cache: dict = {}
_jwks_cache_ts: float = 0.0
_JWKS_TTL = 3600  # 1 hour


def _fetch_jwks() -> dict:
    global _jwks_cache, _jwks_cache_ts
    now = time.time()
    if _jwks_cache and now - _jwks_cache_ts < _JWKS_TTL:
        return _jwks_cache
    if not SUPABASE_JWKS_URL:
        return {}
    resp = requests.get(SUPABASE_JWKS_URL, timeout=10)
    resp.raise_for_status()
    _jwks_cache = resp.json()
    _jwks_cache_ts = now
    return _jwks_cache


def _get_signing_key(token: str):
    """Return the signing key for the JWT, trying JWKS first, then static secret."""
    header = jwt.get_unverified_header(token)
    kid = header.get("kid")

    # Try JWKS
    if SUPABASE_JWKS_URL:
        try:
            jwks = _fetch_jwks()
            for key_data in jwks.get("keys", []):
                if kid and key_data.get("kid") == kid:
                    return jwk.construct(key_data)
                # If no kid in header, try the first key
                if not kid:
                    return jwk.construct(key_data)
        except Exception:
            pass

    # Fallback to static secret
    if SUPABASE_JWT_SECRET:
        return SUPABASE_JWT_SECRET

    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="No JWT verification key configured",
    )


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> str:
    try:
        signing_key = _get_signing_key(credentials.credentials)
        payload = jwt.decode(
            credentials.credentials,
            signing_key,
            algorithms=["HS256", "RS256", "ES256"],
            audience="authenticated",
        )
        return payload["sub"]  # user_id
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
        )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )
