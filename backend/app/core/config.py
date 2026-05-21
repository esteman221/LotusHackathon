from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "FacturaAI Backend"
    app_env: str = "development"

    database_url: str

    anthropic_api_key: str = "TU_API_KEY_AQUI"
    anthropic_model: str = "claude-sonnet-4-20250514"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8"
    )


settings = Settings()