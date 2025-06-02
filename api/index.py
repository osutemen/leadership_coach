from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes.chat import router as chat_router
import os

app = FastAPI(title="Leadership Coach API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for Vercel deployment
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Detect environment - Vercel sets VERCEL=1
is_vercel = os.getenv("VERCEL") == "1"
is_development = os.getenv("NODE_ENV") == "development"

if is_vercel:
    # Production (Vercel): include without prefix since Vercel adds /api
    app.include_router(chat_router)

    @app.get("/health")
    async def health_check():
        return {"status": "healthy", "environment": "vercel"}

else:
    # Development: include with /api prefix
    app.include_router(chat_router, prefix="/api")

    @app.get("/api/health")
    async def health_check():
        return {"status": "healthy", "environment": "development"}


# Vercel serverless function handler
if is_vercel:
    try:
        from mangum import Mangum

        handler = Mangum(app)
    except ImportError as e:
        print(f"Failed to import mangum: {e}")
        raise
