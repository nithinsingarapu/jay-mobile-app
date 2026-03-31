"""
Supabase Auth — JWT verification.

Tries multiple verification strategies in order:
1. HS256 with JWT secret as-is
2. HS256 with base64-decoded JWT secret
3. ES256/RS256 via JWKS public keys
"""

import base64
from typing import Annotated
from fastapi import Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt as pyjwt
from jwt import PyJWKClient

from app.config import get_settings
from app.shared.exceptions import AuthError

security = HTTPBearer()

_jwks_client: PyJWKClient | None = None


def _get_jwks_client() -> PyJWKClient:
    global _jwks_client
    if _jwks_client is None:
        settings = get_settings()
        jwks_url = f"{settings.supabase_url}/auth/v1/.well-known/jwks.json"
        _jwks_client = PyJWKClient(jwks_url, cache_keys=True, lifespan=3600)
    return _jwks_client


def _try_decode(token: str, key, algorithms: list[str]) -> dict | None:
    """Try to decode a JWT. Returns payload on success, None on failure."""
    try:
        return pyjwt.decode(
            token, key, algorithms=algorithms, options={"verify_aud": False},
        )
    except pyjwt.ExpiredSignatureError:
        raise AuthError("Token has expired — please sign in again")
    except (pyjwt.InvalidSignatureError, pyjwt.InvalidAlgorithmError, pyjwt.InvalidTokenError):
        return None


def verify_supabase_token(token: str) -> dict:
    """Verify a Supabase JWT by trying all supported methods."""
    settings = get_settings()

    # Debug: print token header so we can see exactly what's coming in
    try:
        header = pyjwt.get_unverified_header(token)
        print(f"[AUTH] Incoming token: alg={header.get('alg')}, typ={header.get('typ')}, kid={header.get('kid', '-')}")
    except Exception:
        print(f"[AUTH] Cannot decode token header. Token starts with: {token[:40]}...")
        raise AuthError("Malformed token")

    # Strategy 1: HS256 with secret as string
    result = _try_decode(token, settings.supabase_jwt_secret, ["HS256"])
    if result:
        return result

    # Strategy 2: HS256 with base64-decoded secret
    try:
        raw_secret = base64.b64decode(settings.supabase_jwt_secret)
        result = _try_decode(token, raw_secret, ["HS256"])
        if result:
            return result
    except Exception:
        pass

    # Strategy 3: JWKS (ES256, RS256)
    try:
        jwks = _get_jwks_client()
        signing_key = jwks.get_signing_key_from_jwt(token)
        result = _try_decode(token, signing_key.key, ["ES256", "RS256", "EdDSA"])
        if result:
            return result
    except Exception:
        pass

    # Nothing worked — show helpful error
    try:
        header = pyjwt.get_unverified_header(token)
        unverified = pyjwt.decode(token, options={"verify_signature": False})
        print(f"[AUTH] ALL STRATEGIES FAILED. alg={header.get('alg')}, iss={unverified.get('iss')}, sub={unverified.get('sub', '?')[:12]}")
    except Exception:
        print("[AUTH] ALL STRATEGIES FAILED. Could not decode token at all.")

    raise AuthError("Invalid token — could not verify with any method")


class CurrentUser:
    def __init__(self, payload: dict):
        self.id: str = payload["sub"]
        self.email: str = payload.get("email", "")
        self.role: str = payload.get("role", "authenticated")

        meta = payload.get("user_metadata", {})
        self.full_name: str = meta.get("full_name", meta.get("name", ""))
        self.avatar_url: str | None = meta.get("avatar_url", meta.get("picture"))

    def __repr__(self):
        return f"CurrentUser(id={self.id}, email={self.email})"


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
) -> CurrentUser:
    payload = verify_supabase_token(credentials.credentials)
    return CurrentUser(payload)


AuthenticatedUser = Annotated[CurrentUser, Depends(get_current_user)]
