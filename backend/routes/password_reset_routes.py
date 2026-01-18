from fastapi import APIRouter, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel, EmailStr
from datetime import datetime, timezone, timedelta
import os
import random
import string
import asyncio
import resend
import logging
from passlib.context import CryptContext

router = APIRouter(prefix="/password-reset", tags=["password-reset"])

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

RESEND_API_KEY = os.environ.get("RESEND_API_KEY")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")

# Set Resend API key
resend.api_key = RESEND_API_KEY

logger = logging.getLogger(__name__)

def get_db():
    import sys
    sys.path.insert(0, '/app/backend')
    from server import db
    return db

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp: str

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str
    new_password: str

def generate_otp(length=6):
    """Generate a random OTP"""
    return ''.join(random.choices(string.digits, k=length))

@router.post("/forgot-password")
async def forgot_password(
    request: ForgotPasswordRequest,
    db = None
):
    """
    Send OTP to user's email for password reset.
    """
    if db is None:
        db = get_db()
    
    try:
        # Check if user exists
        user = await db.users.find_one({"email": request.email}, {"_id": 0})
        print(user)
        if not user:
            # Don't reveal if email exists for security
            return {
                "status": "success",
                "message": "If the email exists, an OTP has been sent."
            }
        
        # Generate OTP
        otp = generate_otp()
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)
        
        # Store OTP in database
        otp_doc = {
            "email": request.email,
            "otp": otp,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "expires_at": expires_at.isoformat(),
            "used": False
        }
        
        # Delete any existing OTPs for this email
        await db.password_reset_otps.delete_many({"email": request.email})
        
        # Insert new OTP
        await db.password_reset_otps.insert_one(otp_doc)
        
        # Send email with OTP
        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333;">Password Reset Request</h2>
            <p>Hello,</p>
            <p>You requested to reset your password for your NGO Management System account.</p>
            <p>Your OTP (One-Time Password) is:</p>
            <h1 style="background-color: #f0f0f0; padding: 20px; text-align: center; letter-spacing: 8px; color: #333;">
                {otp}
            </h1>
            <p>This OTP will expire in 15 minutes.</p>
            <p>If you didn't request this password reset, please ignore this email.</p>
            <p>Best regards,<br>NGO Management System Team</p>
        </body>
        </html>
        """
        
        params = {
            "from": SENDER_EMAIL,
            "to": [request.email],
            "subject": "Password Reset OTP - NGO Management System",
            "html": html_content
        }
        
        try:
            # Send email asynchronously
            email_response = await asyncio.to_thread(resend.Emails.send, params)
            logger.info(f"Password reset OTP sent to {request.email}, email_id: {email_response.get('id')}")
        except Exception as email_error:
            logger.error(f"Failed to send email: {str(email_error)}")
            # Don't fail the request if email fails, OTP is still stored
        
        return {
            "status": "success",
            "message": "If the email exists, an OTP has been sent."
        }
        
    except Exception as e:
        logger.error(f"Forgot password error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process password reset request"
        )

@router.post("/verify-otp")
async def verify_otp(
    request: VerifyOTPRequest,
    db = None
):
    """
    Verify OTP without resetting password.
    Useful for two-step reset process.
    """
    if db is None:
        db = get_db()
    
    try:
        # Find valid OTP
        otp_doc = await db.password_reset_otps.find_one({
            "email": request.email,
            "otp": request.otp,
            "used": False
        }, {"_id": 0})
        
        if not otp_doc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired OTP"
            )
        
        # Check if OTP is expired
        expires_at = datetime.fromisoformat(otp_doc["expires_at"])
        if datetime.now(timezone.utc) > expires_at:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="OTP has expired"
            )
        
        return {
            "status": "success",
            "message": "OTP verified successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Verify OTP error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to verify OTP"
        )

@router.post("/reset-password")
async def reset_password(
    request: ResetPasswordRequest,
    db = None
):
    """
    Reset password using OTP.
    """
    if db is None:
        db = get_db()
    
    try:
        # Find valid OTP
        otp_doc = await db.password_reset_otps.find_one({
            "email": request.email,
            "otp": request.otp,
            "used": False
        }, {"_id": 0})
        
        if not otp_doc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired OTP"
            )
        
        # Check if OTP is expired
        expires_at = datetime.fromisoformat(otp_doc["expires_at"])
        if datetime.now(timezone.utc) > expires_at:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="OTP has expired"
            )
        
        # Hash new password
        hashed_password = pwd_context.hash(request.new_password)
        
        # Update user password
        result = await db.users.update_one(
            {"email": request.email},
            {"$set": {"hashed_password": hashed_password}}
        )
        
        if result.modified_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Mark OTP as used
        await db.password_reset_otps.update_one(
            {"email": request.email, "otp": request.otp},
            {"$set": {"used": True}}
        )
        
        logger.info(f"Password reset successful for {request.email}")
        
        return {
            "status": "success",
            "message": "Password reset successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Reset password error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to reset password"
        )
