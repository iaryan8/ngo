import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import axios from "axios";
import { Heart, LogOut, DollarSign, CheckCircle, XCircle, Clock } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CURRENCIES = [
  { value: "usd", label: "USD ($)", symbol: "$" },
  { value: "eur", label: "EUR (€)", symbol: "€" },
  { value: "gbp", label: "GBP (£)", symbol: "£" },
  { value: "inr", label: "INR (₹)", symbol: "₹" },
  { value: "cad", label: "CAD ($)", symbol: "C$" },
  { value: "aud", label: "AUD ($)", symbol: "A$" },
  { value: "jpy", label: "JPY (¥)", symbol: "¥" }
];

const UserDashboard = () => {
  const navigate = useNavigate();
  const { user, logout, token } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [donationAmount, setDonationAmount] = useState("");
  const [currency, setCurrency] = useState("usd");
  const [donating, setDonating] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${API}/user/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(response.data);
    } catch (error) {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleDonate = async (e) => {
    e.preventDefault();
    
    if (!donationAmount || parseFloat(donationAmount) <= 0) {
      toast.error("Please enter a valid donation amount");
      return;
    }

    setDonating(true);

    try {
      const originUrl = window.location.origin;
      const response = await axios.post(
        `${API}/donate/initialize`,
        { amount: parseFloat(donationAmount), currency: currency },
        {
          params: { origin_url: originUrl },
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      window.location.href = response.data.checkout_url;
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to initialize donation");
      setDonating(false);
    }
  };

  const getCurrencySymbol = (currencyCode) => {
    const curr = CURRENCIES.find(c => c.value === currencyCode);
    return curr ? curr.symbol : "$";
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-600" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-accent/20 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-primary" data-testid="user-dashboard-title">
              Welcome, {user?.name}
            </h1>
            <p className="text-base text-muted-foreground mt-2">Manage your donations and impact</p>
          </div>
          <Button
            data-testid="logout-btn"
            onClick={handleLogout}
            variant="outline"
            className="rounded-full"
          >
            <LogOut className="mr-2 h-4 w-4" /> Logout
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {/* Stats */}
          <Card className="p-6 rounded-2xl shadow-sm border border-border/50" data-testid="total-donations-card">
            <DollarSign className="h-10 w-10 text-primary mb-4" />
            <h3 className="text-3xl font-bold text-primary">
              {getCurrencySymbol(currency)}{profile?.donation_history.total_donated.toFixed(2)}
            </h3>
            <p className="text-sm text-muted-foreground mt-2">Total Donated ({currency.toUpperCase()})</p>
          </Card>

          <Card className="p-6 rounded-2xl shadow-sm border border-border/50" data-testid="donation-count-card">
            <Heart className="h-10 w-10 text-secondary mb-4" />
            <h3 className="text-3xl font-bold text-primary">{profile?.donation_history.donations.length}</h3>
            <p className="text-sm text-muted-foreground mt-2">Total Donations</p>
          </Card>

          {/* Donate Form */}
          <Card className="p-6 rounded-2xl shadow-sm border border-border/50 bg-secondary/5" data-testid="donation-form-card">
            <h3 className="text-lg font-semibold text-foreground mb-4">Make a Donation</h3>
            <form onSubmit={handleDonate}>
              <Label htmlFor="currency" className="text-sm font-medium">Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="mt-2 mb-4 h-12 rounded-lg" data-testid="currency-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((curr) => (
                    <SelectItem key={curr.value} value={curr.value}>
                      {curr.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Label htmlFor="amount" className="text-sm font-medium">Amount</Label>
              <Input
                id="amount"
                data-testid="donation-amount-input"
                type="number"
                step="0.01"
                min="1"
                value={donationAmount}
                onChange={(e) => setDonationAmount(e.target.value)}
                placeholder="50.00"
                className="mt-2 mb-4 h-12 rounded-lg"
              />
              <Button
                data-testid="donate-submit-btn"
                type="submit"
                disabled={donating}
                className="w-full rounded-full h-12 bg-secondary hover:bg-secondary/90"
              >
                {donating ? "Processing..." : "Donate Now"}
              </Button>
            </form>
          </Card>
        </div>

        {/* Donation History */}
        <Card className="p-8 rounded-2xl shadow-sm border border-border/50" data-testid="donation-history-card">
          <h2 className="text-2xl font-semibold text-foreground mb-6">Donation History</h2>
          
          {profile?.donation_history.donations.length === 0 ? (
            <p className="text-muted-foreground text-center py-8" data-testid="no-donations-message">
              No donations yet. Start making an impact today!
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full" data-testid="donations-table">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Amount</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Transaction ID</th>
                  </tr>
                </thead>
                <tbody>
                  {profile?.donation_history.donations.map((donation) => (
                    <tr key={donation.id} className="border-b border-border/50 hover:bg-accent/20 transition-colors" data-testid={`donation-row-${donation.id}`}>
                      <td className="py-3 px-4 text-sm">{new Date(donation.created_at).toLocaleDateString()}</td>
                      <td className="py-3 px-4 text-sm font-medium">
                        {getCurrencySymbol(donation.currency || "usd")}{donation.amount.toFixed(2)} {(donation.currency || "usd").toUpperCase()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(donation.status)}
                          <span className="text-sm capitalize">{donation.status}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {donation.transaction_id ? donation.transaction_id.slice(0, 20) + '...' : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default UserDashboard;
