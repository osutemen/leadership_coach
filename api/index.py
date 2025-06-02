from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes.chat import router as chat_router
from .routes.youtube_processor import router as youtube_router

app = FastAPI(title="Leadership Coach API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js development server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(chat_router, prefix="/api")
app.include_router(youtube_router, prefix="/api/youtube")


@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}
