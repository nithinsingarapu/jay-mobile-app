import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError
from app.config import get_settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("JAY API started")
    yield
    print("JAY API stopped")


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title="JAY API",
        description="AI-Powered Personal Skincare Companion",
        version="0.1.0",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.exception_handler(IntegrityError)
    async def integrity_error_handler(request: Request, exc: IntegrityError):
        msg = str(exc.orig) if exc.orig else str(exc)
        if "unique" in msg.lower() or "duplicate" in msg.lower():
            return JSONResponse(status_code=409, content={"detail": "A record with that value already exists"})
        return JSONResponse(status_code=500, content={"detail": "Database error"})

    @app.get("/health")
    async def health():
        return {"status": "ok", "service": "jay-api", "version": "0.1.0"}

    # Profile feature
    from app.features.profile.router import router as profile_router
    app.include_router(profile_router, prefix="/api/v1/profile", tags=["Profile"])

    # Chat feature (Ask JAY)
    from app.features.chat.router import router as chat_router
    app.include_router(chat_router, prefix="/api/v1/chat", tags=["Chat"])

    # Products
    from app.features.products.router import router as products_router
    app.include_router(products_router, prefix="/api/v1/products", tags=["Products"])

    # Routine builder
    from app.features.routine.router import router as routine_router
    app.include_router(routine_router, prefix="/api/v1/routine", tags=["Routine"])

    # Content (Discover section — articles, ingredients, concerns, myths, tips)
    from app.features.content.router import router as content_router
    app.include_router(content_router, prefix="/api/v1/content", tags=["Content"])

    # Dev-only: test token generator (no frontend needed to test)
    if settings.debug:
        import jwt as pyjwt

        @app.post("/dev/test-token", tags=["Dev"])
        async def create_test_token(email: str = "test@test.com", name: str = "Test User"):
            """
            DEV ONLY. Generates a fake Supabase JWT for testing.
            Same email always produces same user_id (deterministic via uuid5).
            """
            user_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, email))
            payload = {
                "sub": user_id,
                "email": email,
                "aud": "authenticated",
                "role": "authenticated",
                "user_metadata": {"full_name": name},
                "iat": datetime.now(timezone.utc),
                "exp": datetime.now(timezone.utc) + timedelta(hours=2),
            }
            token = pyjwt.encode(payload, settings.supabase_jwt_secret, algorithm="HS256")
            return {"access_token": token, "user_id": user_id, "email": email}

    return app


app = create_app()
