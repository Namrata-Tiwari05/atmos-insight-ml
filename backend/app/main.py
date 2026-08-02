import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from datetime import datetime
from app.config.settings import settings
from app.api.demo import router as demo_router
from app.api.weather import router as weather_router
from app.api.air_quality import router as air_quality_router
from app.api.current_aqi import router as current_aqi_router
from app.api.forecast import router as forecast_router
from app.api.analytics import router as analytics_router
from app.api.location import router as location_router
from app.ml.model_loader import model_loader
from app.core.logging import logger

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Application starting up... Initializing cached model loader.")
    model_loader.initialize()
    yield

# Initialize FastAPI App
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Production-ready FastAPI backend for Air Quality Prediction & Forecasting.",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files directory if available
static_dir = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")

# Register Routers
app.include_router(demo_router, prefix="/api")
app.include_router(weather_router, prefix="/api")
app.include_router(air_quality_router, prefix="/api")
app.include_router(current_aqi_router, prefix="/api")
app.include_router(forecast_router, prefix="/api")
app.include_router(analytics_router, prefix="/api")
app.include_router(location_router, prefix="/api")

@app.get("/")
def read_root():
    logger.info("Root endpoint visited.")
    return {
        "status": "online",
        "environment": settings.ENVIRONMENT,
        "message": f"Welcome to the {settings.PROJECT_NAME}!"
    }

@app.get("/health")
def read_health():
    logger.info("Health check endpoint visited.")
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "details": {
            "environment": settings.ENVIRONMENT,
            "ml_models": "loaded" if model_loader.initialized else "not_loaded"
        }
    }
