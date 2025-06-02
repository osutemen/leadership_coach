from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

try:
    from api.routes.chat import router as chat_router
except ImportError:
    from .routes.chat import router as chat_router

app = FastAPI(title="Leadership Coach API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include router with /api prefix for development
app.include_router(chat_router, prefix="/api")


@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "environment": "development"}
