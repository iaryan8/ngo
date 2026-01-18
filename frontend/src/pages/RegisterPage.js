import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { UserPlus } from "lucide-react";

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await register(formData.name, formData.email, formData.password);
      toast.success("Registration successful! Welcome to HopeConnect.");
      navigate("/user-dashboard");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-accent/20">
      <Card className="w-full max-w-md p-8 rounded-2xl shadow-lg border border-border/50">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary/10 mb-4">
            <UserPlus className="h-8 w-8 text-secondary" />
          </div>
          <h1 className="text-3xl font-semibold text-foreground mb-2">Join HopeConnect</h1>
          <p className="text-base text-muted-foreground">Create your account and start making a difference</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
            <Input
              id="name"
              data-testid="register-name-input"
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-2 h-12 rounded-lg"
              placeholder="John Doe"
            />
          </div>

          <div>
            <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
            <Input
              id="email"
              data-testid="register-email-input"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="mt-2 h-12 rounded-lg"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <Label htmlFor="password" className="text-sm font-medium">Password</Label>
            <Input
              id="password"
              data-testid="register-password-input"
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="mt-2 h-12 rounded-lg"
              placeholder="••••••••"
              minLength={6}
            />
            <p className="text-xs text-muted-foreground mt-1">Minimum 6 characters</p>
          </div>

          <Button
            data-testid="register-submit-btn"
            type="submit"
            disabled={loading}
            variant="default"
            className="w-full rounded-full h-12 text-base font-medium bg-secondary hover:bg-secondary/90"
          >
            {loading ? "Creating account..." : "Create Account"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline" data-testid="login-link">
              Sign in here
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
};

export default RegisterPage;
