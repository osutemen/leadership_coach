from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes.chat import router as chat_router

# Create FastAPI app for Vercel
app = FastAPI(title="Leadership Coach API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers with fastapi prefix for Vercel
app.include_router(chat_router, prefix="/api/fastapi")


@app.get("/api/fastapi/health")
async def health_check():
    return {"status": "healthy"}


# This is the entry point for Vercel
def handler(request, context):
    return app(request, context)
