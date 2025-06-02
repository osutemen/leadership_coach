from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

try:
    from api.routes.chat import router as chat_router
    from api.routes.youtube_processor import router as youtube_router
except ImportError:
    from .routes.chat import router as chat_router
    from .routes.youtube_processor import router as youtube_router

app = FastAPI(title="Leadership Coach API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers with /api prefix for development
app.include_router(chat_router, prefix="/api")
app.include_router(youtube_router, prefix="/api/youtube", tags=["YouTube Processor"])


@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "environment": "development"}
