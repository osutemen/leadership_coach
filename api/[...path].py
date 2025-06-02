from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes.chat import router as chat_router
import os

# Create FastAPI app for Vercel serverless
app = FastAPI(title="Leadership Coach API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(chat_router, prefix="/api/fastapi")


@app.get("/api/fastapi/health")
async def health_check():
    return {"status": "healthy", "environment": "vercel"}


# Vercel serverless function handler
def handler(request):
    import uvicorn
    from mangum import Mangum

    # Create ASGI handler for Vercel
    asgi_handler = Mangum(app, lifespan="off")
    return asgi_handler(request, {})
