from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "FacturaAI Backend"
    app_env: str = "development"

    database_url: str

    gemini_api_key: str = "AIzaSyDoKVd96nb9T_WjLHLFvvo-x1EfWBSK5YI"
    gemini_model: str = "gemini-2.0-flash"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8"
    )


settings = Settings()