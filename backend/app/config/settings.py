import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # 1. Project metadata configurations
    PROJECT_NAME: str = "Air Quality Assessment & AQI Forecasting API"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    
    # 2. Server configuration variables
    HOST: str = "127.0.0.1"
    PORT: int = 8000
    
    # 3. CORS Allowed Origins
   # pyrefly: ignore [parse-error]
   CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5175",
        "https://atmos-insight-ml-gcwy.vercel.app"
]
    # 4. OpenWeatherMap Integrations
    OPENWEATHER_API_KEY: str
    LATITUDE: float = 26.4499  # Default Kanpur
    LONGITUDE: float = 80.3319  # Default Kanpur
    
    # Pydantic Settings Configuration
    model_config = SettingsConfigDict(
        env_file=(
            os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), ".env"),
            ".env"
        ),
        env_file_encoding="utf-8",
        extra="ignore"
    )

# Instantiate settings object
settings = Settings()
