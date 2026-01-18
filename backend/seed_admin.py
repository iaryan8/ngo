import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from auth import get_password_hash
from models import UserRole
import os
import uuid
from datetime import datetime, timezone
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

async def create_admin():
    """Create a default admin user."""
    mongo_url = os.environ['MONGO_URL']
    db_name = os.environ['DB_NAME']
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    # Check if admin already exists
    existing_admin = await db.users.find_one({"email": "admin@ngo.com"})
    
    if existing_admin:
        print("Admin user already exists!")
        client.close()
        return
    
    # Create admin user
    admin_doc = {
        "id": str(uuid.uuid4()),
        "name": "Admin User",
        "email": "admin@ngo.com",
        "hashed_password": get_password_hash("admin123"),
        "role": UserRole.ADMIN,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(admin_doc)
    print("\n✅ Admin user created successfully!")
    print("Email: admin@ngo.com")
    print("Password: admin123")
    print("\n⚠️  Please change the password after first login!\n")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(create_admin())
