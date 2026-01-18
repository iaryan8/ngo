import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import axios from "axios";
import { LogOut, Users, DollarSign, TrendingUp } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, logout, token } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await axios.get(`${API}/admin/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      toast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
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
            <h1 className="text-4xl font-bold text-primary" data-testid="admin-dashboard-title">
              Admin Dashboard
            </h1>
            <p className="text-base text-muted-foreground mt-2">Monitor registrations and donations</p>
          </div>
          <Button
            data-testid="admin-logout-btn"
            onClick={handleLogout}
            variant="outline"
            className="rounded-full"
          >
            <LogOut className="mr-2 h-4 w-4" /> Logout
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          <Card className="p-6 rounded-2xl shadow-sm border border-border/50" data-testid="total-users-card">
            <Users className="h-10 w-10 text-primary mb-4" />
            <h3 className="text-3xl font-bold text-primary">{stats?.total_users}</h3>
            <p className="text-sm text-muted-foreground mt-2">Total Users</p>
          </Card>

          <Card className="p-6 rounded-2xl shadow-sm border border-border/50" data-testid="total-donations-count-card">
            <TrendingUp className="h-10 w-10 text-secondary mb-4" />
            <h3 className="text-3xl font-bold text-primary">{stats?.total_donations}</h3>
            <p className="text-sm text-muted-foreground mt-2">Total Donations</p>
          </Card>

          <Card className="p-6 rounded-2xl shadow-sm border border-border/50" data-testid="total-amount-card">
            <DollarSign className="h-10 w-10 text-secondary mb-4" />
            <h3 className="text-3xl font-bold text-primary">${stats?.total_amount.toFixed(2)}</h3>
            <p className="text-sm text-muted-foreground mt-2">Total Amount Raised</p>
          </Card>
        </div>

        {/* Recent Registrations */}
        <Card className="p-8 rounded-2xl shadow-sm border border-border/50 mb-8" data-testid="recent-registrations-card">
          <h2 className="text-2xl font-semibold text-foreground mb-6">Recent Registrations</h2>
          <div className="overflow-x-auto">
            <table className="w-full" data-testid="registrations-table">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Name</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Email</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Role</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Registered</th>
                </tr>
              </thead>
              <tbody>
                {stats?.recent_registrations.map((user) => (
                  <tr key={user.id} className="border-b border-border/50 hover:bg-accent/20 transition-colors" data-testid={`user-row-${user.id}`}>
                    <td className="py-3 px-4 text-sm font-medium">{user.name}</td>
                    <td className="py-3 px-4 text-sm">{user.email}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary capitalize">
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Recent Donations */}
        <Card className="p-8 rounded-2xl shadow-sm border border-border/50" data-testid="recent-donations-card">
          <h2 className="text-2xl font-semibold text-foreground mb-6">Recent Donations</h2>
          <div className="overflow-x-auto">
            <table className="w-full" data-testid="admin-donations-table">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Donor</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Email</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Amount</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Date</th>
                </tr>
              </thead>
              <tbody>
                {stats?.recent_donations.map((donation) => (
                  <tr key={donation.id} className="border-b border-border/50 hover:bg-accent/20 transition-colors" data-testid={`admin-donation-row-${donation.id}`}>
                    <td className="py-3 px-4 text-sm font-medium">{donation.user_name}</td>
                    <td className="py-3 px-4 text-sm">{donation.user_email}</td>
                    <td className="py-3 px-4 text-sm font-medium">${donation.amount.toFixed(2)}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                        donation.status === 'success' ? 'bg-green-100 text-green-800' :
                        donation.status === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {donation.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {new Date(donation.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
