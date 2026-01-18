from fastapi import APIRouter, HTTPException, status, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from models import UserRegister, UserLogin, Token, User, UserInDB
from auth import verify_password, get_password_hash, create_access_token
import uuid
from datetime import datetime, timezone

router = APIRouter(prefix="/auth", tags=["authentication"])

def get_db():
    import sys
    sys.path.insert(0, '/app/backend')
    from server import db
    return db

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister, db: AsyncIOMotorDatabase = Depends(get_db)):
    """
    Register a new user.
    User data is saved regardless of any subsequent operations.
    """
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user document
    user_id = str(uuid.uuid4())
    hashed_password = get_password_hash(user_data.password)
    
    user_doc = {
        "id": user_id,
        "name": user_data.name,
        "email": user_data.email,
        "hashed_password": hashed_password,
        "role": user_data.role,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Save user data (critical: data integrity)
    await db.users.insert_one(user_doc)
    
    # Create user response (excluding password)
    user = User(
        id=user_id,
        name=user_data.name,
        email=user_data.email,
        role=user_data.role,
        created_at=datetime.now(timezone.utc)
    )
    
    # Create access token
    access_token = create_access_token(
        data={"user_id": user_id, "email": user_data.email, "role": user_data.role}
    )
    
    return Token(access_token=access_token, user=user)

@router.post("/login", response_model=Token)
async def login(credentials: UserLogin, db: AsyncIOMotorDatabase = Depends(get_db)):
    """
    Login with email and password.
    Returns JWT token with user role for client-side routing.
    """
    # Find user
    user_doc = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    
    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Verify password
    if not verify_password(credentials.password, user_doc["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Parse datetime
    if isinstance(user_doc['created_at'], str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    
    user = User(**{k: v for k, v in user_doc.items() if k != 'hashed_password'})
    
    # Create access token
    access_token = create_access_token(
        data={"user_id": user.id, "email": user.email, "role": user.role}
    )
    
    return Token(access_token=access_token, user=user)
