from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import Optional, List
from datetime import datetime, timezone
from enum import Enum

class UserRole(str, Enum):
    USER = "user"
    ADMIN = "admin"

class DonationStatus(str, Enum):
    PENDING = "pending"
    SUCCESS = "success"
    FAILED = "failed"

class Currency(str, Enum):
    INR = "inr"
    USD = "usd"
    EUR = "eur"
    GBP = "gbp"
    CAD = "cad"
    AUD = "aud"
    JPY = "jpy"

class UserBase(BaseModel):
    name: str
    email: EmailStr

class UserRegister(UserBase):
    password: str
    role: UserRole = UserRole.USER

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(UserBase):
    model_config = ConfigDict(extra="ignore")
    id: str
    role: UserRole
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserInDB(User):
    hashed_password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: User

class DonationBase(BaseModel):
    amount: float
    currency: Currency = Currency.USD

class DonationCreate(DonationBase):
    pass

class Donation(DonationBase):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    transaction_id: Optional[str] = None
    status: DonationStatus
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: Optional[datetime] = None

class DonationHistory(BaseModel):
    donations: List[Donation]
    total_donated: float

class UserProfile(BaseModel):
    user: User
    donation_history: DonationHistory

class AdminStats(BaseModel):
    total_users: int
    total_donations: int
    total_amount: float
    recent_registrations: List[User]
    recent_donations: List[dict]
