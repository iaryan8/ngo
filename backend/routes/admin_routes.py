from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from models import AdminStats, User
from dependencies import get_current_admin
from datetime import datetime

router = APIRouter(prefix="/admin", tags=["admin"])

def get_db():
    import sys
    sys.path.insert(0, '/app/backend')
    from server import db
    return db

@router.get("/dashboard", response_model=AdminStats)
async def get_dashboard(
    current_admin: dict = Depends(get_current_admin),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Get admin dashboard with statistics.
    Shows all registrations and donations accurately.
    """
    # Count total users
    total_users = await db.users.count_documents({})
    
    # Count total donations
    total_donations = await db.donations.count_documents({})
    
    # Calculate total donation amount (only successful donations)
    pipeline = [
        {"$match": {"status": "success"}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]
    result = await db.donations.aggregate(pipeline).to_list(1)
    total_amount = result[0]["total"] if result else 0.0
    
    # Get recent registrations (last 10)
    recent_users_cursor = db.users.find({}, {"_id": 0, "hashed_password": 0}).sort("created_at", -1).limit(10)
    recent_users_list = await recent_users_cursor.to_list(10)
    
    recent_registrations = []
    for user_doc in recent_users_list:
        if isinstance(user_doc['created_at'], str):
            user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
        recent_registrations.append(User(**user_doc))
    
    # Get recent donations (last 20) with user info
    donations_cursor = db.donations.find({}, {"_id": 0}).sort("created_at", -1).limit(20)
    donations_list = await donations_cursor.to_list(20)
    
    recent_donations = []
    for don in donations_list:
        # Get user info
        user_doc = await db.users.find_one({"id": don["user_id"]}, {"_id": 0, "hashed_password": 0})
        
        recent_donations.append({
            "id": don["id"],
            "user_name": user_doc["name"] if user_doc else "Unknown",
            "user_email": user_doc["email"] if user_doc else "Unknown",
            "amount": don["amount"],
            "status": don["status"],
            "created_at": don["created_at"]
        })
    
    return AdminStats(
        total_users=total_users,
        total_donations=total_donations,
        total_amount=total_amount,
        recent_registrations=recent_registrations,
        recent_donations=recent_donations
    )
