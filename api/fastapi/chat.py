from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum
import sys
import os

# Add the parent directory to the path to import modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from api.routes.chat import router as chat_router

# Create FastAPI app for this specific endpoint
app = FastAPI(title="Leadership Coach Chat API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include only the chat router
app.include_router(chat_router, prefix="")

# Vercel handler
handler = Mangum(app, lifespan="off")
