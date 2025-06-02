from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes.chat import router as chat_router

app = FastAPI(title="Leadership Coach API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for Vercel deployment
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers without /api prefix since Vercel adds it
app.include_router(chat_router)


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


# Vercel serverless function handler
from mangum import Mangum

handler = Mangum(app)
