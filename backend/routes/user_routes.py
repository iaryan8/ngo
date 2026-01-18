from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from models import UserProfile, User, Donation, DonationHistory
from dependencies import get_current_user
from datetime import datetime

router = APIRouter(prefix="/user", tags=["user"])

def get_db():
    import sys
    sys.path.insert(0, '/app/backend')
    from server import db
    return db

@router.get("/profile", response_model=UserProfile)
async def get_profile(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Get current user profile with donation history.
    """
    # Get user details
    user_doc = await db.users.find_one({"id": current_user["user_id"]}, {"_id": 0, "hashed_password": 0})
    
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Parse datetime
    if isinstance(user_doc['created_at'], str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    
    user = User(**user_doc)
    
    # Get donation history
    donations_cursor = db.donations.find({"user_id": current_user["user_id"]}, {"_id": 0}).sort("created_at", -1)
    donations_list = await donations_cursor.to_list(length=100)
    
    # Parse datetimes and create Donation objects
    donations = []
    total_donated = 0.0
    
    for don in donations_list:
        if isinstance(don['created_at'], str):
            don['created_at'] = datetime.fromisoformat(don['created_at'])
        if don.get('updated_at') and isinstance(don['updated_at'], str):
            don['updated_at'] = datetime.fromisoformat(don['updated_at'])
        
        donation = Donation(**don)
        donations.append(donation)
        
        # Only count successful donations
        if donation.status == "success":
            total_donated += donation.amount
    
    donation_history = DonationHistory(
        donations=donations,
        total_donated=total_donated
    )
    
    return UserProfile(user=user, donation_history=donation_history)
