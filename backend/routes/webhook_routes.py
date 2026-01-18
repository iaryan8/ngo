from fastapi import APIRouter, Request, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from emergentintegrations.payments.stripe.checkout import StripeCheckout
import os
from datetime import datetime, timezone

router = APIRouter(prefix="/webhook", tags=["webhooks"])

STRIPE_API_KEY = os.environ.get("STRIPE_API_KEY")

def get_db():
    import sys
    sys.path.insert(0, '/app/backend')
    from server import db
    return db

@router.post("/stripe")
async def stripe_webhook(request: Request):
    """
    Handle Stripe webhook events.
    Updates donation status based on payment events.
    """
    try:
        db = get_db()
        body = await request.body()
        signature = request.headers.get("Stripe-Signature")
        
        webhook_url = "https://placeholder.com/webhook"
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
        
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        session_id = webhook_response.session_id
        payment_status = webhook_response.payment_status
        
        # Update donation status
        donation_status = "success" if payment_status == "paid" else "failed"
        
        await db.donations.update_one(
            {"transaction_id": session_id},
            {"$set": {
                "status": donation_status,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        # Update payment_transactions
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {
                "payment_status": payment_status,
                "status": donation_status,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        return {"status": "success"}
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
