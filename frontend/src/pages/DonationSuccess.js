import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import axios from "axios";
import { CheckCircle, Loader2 } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CURRENCY_SYMBOLS = {
  usd: "$",
  eur: "€",
  gbp: "£",
  inr: "₹",
  cad: "C$",
  aud: "A$",
  jpy: "¥"
};

const DonationSuccess = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [searchParams] = useSearchParams();
  const [verifying, setVerifying] = useState(true);
  const [donationDetails, setDonationDetails] = useState(null);

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (sessionId) {
      verifyPayment(sessionId);
    }
  }, [searchParams]);

  const verifyPayment = async (sessionId) => {
    let attempts = 0;
    const maxAttempts = 10;
    const pollInterval = 3000;

    const poll = async () => {
      try {
        const response = await axios.get(`${API}/donate/verify/${sessionId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.payment_status === "paid") {
          setDonationDetails(response.data);
          setVerifying(false);
          toast.success("Payment verified successfully!");
          return;
        }

        if (response.data.status === "failed" || response.data.status === "expired") {
          setVerifying(false);
          toast.error("Payment verification failed. Please check your donation history.");
          return;
        }

        attempts++;
        
        if (attempts >= maxAttempts) {
          setVerifying(false);
          toast.warning("Payment is still processing. Please check your donation history in a few minutes.");
          return;
        }

        setTimeout(poll, pollInterval);
      } catch (error) {
        console.error("Payment verification error:", error);
        attempts++;
        
        if (attempts >= maxAttempts) {
          setVerifying(false);
          toast.error("Unable to verify payment. Please check your donation history.");
        } else {
          setTimeout(poll, pollInterval);
        }
      }
    };

    poll();
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-accent/20">
      <Card className="w-full max-w-md p-8 rounded-2xl shadow-lg border border-border/50 text-center" data-testid="donation-success-card">
        {verifying ? (
          <>
            <Loader2 className="h-16 w-16 text-primary mx-auto mb-6 animate-spin" />
            <h1 className="text-2xl font-semibold text-foreground mb-4">Verifying Payment...</h1>
            <p className="text-base text-muted-foreground">Please wait while we confirm your donation.</p>
          </>
        ) : donationDetails ? (
          <>
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-primary mb-4" data-testid="success-title">Thank You!</h1>
            <p className="text-lg text-muted-foreground mb-6">
              Your donation of <span className="font-bold text-secondary">
                {CURRENCY_SYMBOLS[donationDetails.currency] || "$"}{donationDetails.amount.toFixed(2)} {donationDetails.currency?.toUpperCase()}
              </span> has been received.
            </p>
            <p className="text-base text-muted-foreground mb-8">
              Your generosity helps us continue our mission to create lasting change in communities around the world.
            </p>
            <Button
              data-testid="back-to-dashboard-btn"
              onClick={() => navigate("/user-dashboard")}
              className="w-full rounded-full h-12 bg-secondary hover:bg-secondary/90"
            >
              Back to Dashboard
            </Button>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-semibold text-foreground mb-4">Verification Issue</h1>
            <p className="text-base text-muted-foreground mb-6">
              We couldn't verify your payment at this time. Please check your donation history or contact support.
            </p>
            <Button
              data-testid="back-to-dashboard-btn-error"
              onClick={() => navigate("/user-dashboard")}
              className="w-full rounded-full h-12"
            >
              Back to Dashboard
            </Button>
          </>
        )}
      </Card>
    </div>
  );
};

export default DonationSuccess;
