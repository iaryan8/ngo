from fastapi import FastAPI, APIRouter, Request, status
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI(title="NGO Registration and Donation Management System")

# Create API router
api_router = APIRouter(prefix="/api")

# Import routes
from routes import auth_routes, donation_routes, user_routes, admin_routes, webhook_routes, password_reset_routes

# Include routers
api_router.include_router(auth_routes.router)
api_router.include_router(donation_routes.router)
api_router.include_router(user_routes.router)
api_router.include_router(admin_routes.router)
api_router.include_router(webhook_routes.router)
api_router.include_router(password_reset_routes.router)

# Health check
@api_router.get("/")
async def root():
    return {"message": "NGO Management System API", "status": "running"}

app.include_router(api_router)

# Global error handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global error handling middleware to prevent server crashes."""
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error", "error": str(exc)}
    )

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
