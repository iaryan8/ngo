from fastapi import APIRouter, HTTPException, status, Depends, Request
from motor.motor_asyncio import AsyncIOMotorDatabase
from models import DonationCreate, Donation, DonationStatus
from dependencies import get_current_user
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionRequest, CheckoutSessionResponse, CheckoutStatusResponse
import uuid
import os
from datetime import datetime, timezone

router = APIRouter(prefix="/donate", tags=["donations"])

STRIPE_API_KEY = os.environ.get("STRIPE_API_KEY")

def get_db():
    import sys
    sys.path.insert(0, '/app/backend')
    from server import db
    return db

@router.post("/initialize")
async def initialize_donation(
    donation_data: DonationCreate,
    origin_url: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Initialize a donation and create Stripe checkout session.
    CRITICAL: Donation record is created BEFORE payment to ensure data integrity.
    """
    # Create donation ID
    donation_id = str(uuid.uuid4())
    
    # Create donation document with PENDING status (data integrity: save before payment)
    donation_doc = {
        "id": donation_id,
        "user_id": current_user["user_id"],
        "amount": donation_data.amount,
        "currency": donation_data.currency,
        "transaction_id": None,
        "status": DonationStatus.PENDING,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": None
    }
    
    # Save donation immediately (ensures data persists regardless of payment outcome)
    await db.donations.insert_one(donation_doc)
    
    # Create Stripe checkout session
    try:
        webhook_url = f"{origin_url}/api/webhook/stripe"
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
        
        success_url = f"{origin_url}/donation-success?session_id={{{{CHECKOUT_SESSION_ID}}}}"
        cancel_url = f"{origin_url}/user-dashboard"
        
        checkout_request = CheckoutSessionRequest(
            amount=donation_data.amount,
            currency=donation_data.currency,
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                "donation_id": donation_id,
                "user_id": current_user["user_id"],
                "email": current_user["email"]
            }
        )
        
        session: CheckoutSessionResponse = await stripe_checkout.create_checkout_session(checkout_request)
        
        # Update donation with session ID
        await db.donations.update_one(
            {"id": donation_id},
            {"$set": {"transaction_id": session.session_id}}
        )
        
        # Also create payment_transactions record
        payment_transaction = {
            "id": str(uuid.uuid4()),
            "donation_id": donation_id,
            "session_id": session.session_id,
            "user_id": current_user["user_id"],
            "email": current_user["email"],
            "amount": donation_data.amount,
            "currency": donation_data.currency,
            "payment_status": "pending",
            "status": "initiated",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.payment_transactions.insert_one(payment_transaction)
        
        return {"checkout_url": session.url, "session_id": session.session_id, "donation_id": donation_id}
        
    except Exception as e:
        # Even if payment fails, donation record remains (data integrity)
        await db.donations.update_one(
            {"id": donation_id},
            {"$set": {"status": DonationStatus.FAILED, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create payment session: {str(e)}"
        )

@router.get("/verify/{session_id}")
async def verify_donation(
    session_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Verify donation status by checking Stripe session.
    Updates donation record based on payment status.
    """
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        # Find donation by transaction_id first
        donation_doc = await db.donations.find_one({"transaction_id": session_id}, {"_id": 0})
        
        if not donation_doc:
            logger.error(f"Donation not found for session_id: {session_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Donation not found"
            )
        
        logger.info(f"Verifying payment for session: {session_id}, current status: {donation_doc['status']}")
        
        # Check Stripe payment status
        try:
            webhook_url = "https://placeholder.com/webhook"  # Not used for status check
            stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
            checkout_status: CheckoutStatusResponse = await stripe_checkout.get_checkout_status(session_id)
            
            logger.info(f"Stripe status - payment_status: {checkout_status.payment_status}, status: {checkout_status.status}")
            
            # Update donation status based on payment status
            new_status = DonationStatus.SUCCESS if checkout_status.payment_status == "paid" else DonationStatus.PENDING
            
            if checkout_status.status == "expired":
                new_status = DonationStatus.FAILED
            
            # Only update if status changed (prevents duplicate processing)
            if donation_doc["status"] != new_status:
                await db.donations.update_one(
                    {"transaction_id": session_id},
                    {"$set": {"status": new_status, "updated_at": datetime.now(timezone.utc).isoformat()}}
                )
                
                # Update payment_transactions
                await db.payment_transactions.update_one(
                    {"session_id": session_id},
                    {"$set": {
                        "payment_status": checkout_status.payment_status,
                        "status": new_status,
                        "updated_at": datetime.now(timezone.utc).isoformat()
                    }}
                )
                
                logger.info(f"Updated donation status from {donation_doc['status']} to {new_status}")
            
            return {
                "donation_id": donation_doc["id"],
                "status": new_status,
                "payment_status": checkout_status.payment_status,
                "amount": checkout_status.amount_total / 100,  # Convert cents to dollars
                "currency": donation_doc.get("currency", "usd")
            }
            
        except Exception as stripe_error:
            logger.error(f"Stripe API error: {str(stripe_error)}")
            # Return current donation status if Stripe check fails
            return {
                "donation_id": donation_doc["id"],
                "status": donation_doc["status"],
                "payment_status": "unknown",
                "amount": donation_doc["amount"],
                "currency": donation_doc.get("currency", "usd"),
                "error": "Unable to verify with payment provider"
            }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in verify_donation: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to verify payment: {str(e)}"
        )
