from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    supabase_url: str = "https://placeholder.supabase.co"
    supabase_jwt_secret: str = "placeholder-secret"
    gemini_api_key: str = ""
    database_url: str = "postgresql+asyncpg://localhost:5432/jay"
    serper_api_key: str = ""
    groq_api_key: str = ""
    debug: bool = True

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


@lru_cache
def get_settings() -> Settings:
    return Settings()
