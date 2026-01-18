import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import axios from "axios";
import { ArrowLeft, Mail, Lock, KeyRound } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Email, 2: OTP + New Password
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    otp: "",
    newPassword: "",
    confirmPassword: ""
  });

  const handleSendOTP = async (e) => {
    e.preventDefault();
    
    if (!formData.email) {
      toast.error("Please enter your email address");
      return;
    }

    setLoading(true);

    try {
      await axios.post(`${API}/password-reset/forgot-password`, {
        email: formData.email
      });

      toast.success("OTP sent to your email! Please check your inbox.");
      setStep(2);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!formData.otp || !formData.newPassword || !formData.confirmPassword) {
      toast.error("Please fill all fields");
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (formData.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);

    try {
      await axios.post(`${API}/password-reset/reset-password`, {
        email: formData.email,
        otp: formData.otp,
        new_password: formData.newPassword
      });

      toast.success("Password reset successfully! Redirecting to login...");
      setTimeout(() => navigate("/login"), 2000);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    try {
      await axios.post(`${API}/password-reset/forgot-password`, {
        email: formData.email
      });
      toast.success("OTP resent to your email!");
    } catch (error) {
      toast.error("Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-accent/20">
      <Card className="w-full max-w-md p-8 rounded-2xl shadow-lg border border-border/50">
        <Button
          variant="ghost"
          onClick={() => step === 1 ? navigate("/login") : setStep(1)}
          className="mb-6 -ml-2"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            {step === 1 ? (
              <Mail className="h-8 w-8 text-primary" />
            ) : (
              <KeyRound className="h-8 w-8 text-primary" />
            )}
          </div>
          <h1 className="text-3xl font-bold text-primary mb-2">
            {step === 1 ? "Forgot Password?" : "Reset Password"}
          </h1>
          <p className="text-base text-muted-foreground">
            {step === 1 
              ? "Enter your email to receive a password reset OTP"
              : "Enter the OTP sent to your email and create a new password"
            }
          </p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleSendOTP} className="space-y-6">
            <div>
              <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="your@email.com"
                className="mt-2 h-12 rounded-lg"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full rounded-full h-12 bg-primary hover:bg-primary/90"
            >
              {loading ? "Sending..." : "Send OTP"}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-6">
            <div>
              <Label htmlFor="otp" className="text-sm font-medium">OTP Code</Label>
              <Input
                id="otp"
                type="text"
                maxLength="6"
                value={formData.otp}
                onChange={(e) => setFormData({ ...formData, otp: e.target.value.replace(/\D/g, '') })}
                placeholder="Enter 6-digit OTP"
                className="mt-2 h-12 rounded-lg text-center text-2xl tracking-widest"
                required
              />
              <div className="flex justify-end mt-2">
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={loading}
                  className="text-sm text-primary hover:underline"
                >
                  Resend OTP
                </button>
              </div>
            </div>

            <div>
              <Label htmlFor="newPassword" className="text-sm font-medium">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                placeholder="Enter new password"
                className="mt-2 h-12 rounded-lg"
                required
              />
            </div>

            <div>
              <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="Confirm new password"
                className="mt-2 h-12 rounded-lg"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full rounded-full h-12 bg-primary hover:bg-primary/90"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
};

export default ForgotPassword;
