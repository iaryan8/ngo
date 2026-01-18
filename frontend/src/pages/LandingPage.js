import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Heart, Users, Target, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const LandingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGetStarted = () => {
    if (user) {
      if (user.role === "admin") {
        navigate("/admin-dashboard");
      } else {
        navigate("/user-dashboard");
      }
    } else {
      navigate("/register");
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="landing-hero relative min-h-screen flex items-center justify-center py-20 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1544772711-57da9c7368fa"
            alt="Children learning"
            className="w-full h-full object-cover opacity-10"
          />
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-primary mb-8">
            Transform Lives Through
            <span className="block text-secondary mt-2">Compassionate Giving</span>
          </h1>
          
          <p className="text-lg md:text-xl leading-relaxed text-muted-foreground max-w-3xl mx-auto mb-12">
            Join HopeConnect in creating lasting change. Every contribution, big or small, 
            helps build a better tomorrow for communities in need.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              data-testid="get-started-btn"
              onClick={handleGetStarted}
              size="lg"
              className="donation-button rounded-full px-8 py-6 text-lg font-medium shadow-lg bg-secondary hover:bg-secondary/90"
            >
              Get Started <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            
            {!user && (
              <Button
                data-testid="login-btn"
                onClick={() => navigate("/login")}
                variant="outline"
                size="lg"
                className="rounded-full px-8 py-6 text-lg font-medium border-2 border-primary hover:bg-accent"
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Impact Stats */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-accent/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div data-testid="stat-card-communities" className="stat-card bg-card rounded-2xl p-8 shadow-sm border border-border/50">
              <Users className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-4xl font-bold text-primary mb-2">5,000+</h3>
              <p className="text-base text-muted-foreground">Lives Impacted</p>
            </div>
            
            <div data-testid="stat-card-projects" className="stat-card bg-card rounded-2xl p-8 shadow-sm border border-border/50">
              <Target className="h-12 w-12 text-secondary mb-4" />
              <h3 className="text-4xl font-bold text-primary mb-2">150+</h3>
              <p className="text-base text-muted-foreground">Active Projects</p>
            </div>
            
            <div data-testid="stat-card-donors" className="stat-card bg-card rounded-2xl p-8 shadow-sm border border-border/50">
              <Heart className="h-12 w-12 text-secondary mb-4" />
              <h3 className="text-4xl font-bold text-primary mb-2">2,000+</h3>
              <p className="text-base text-muted-foreground">Generous Donors</p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Mission */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground mb-6">
                Building Hope, One Community at a Time
              </h2>
              <p className="text-base leading-relaxed text-muted-foreground mb-6">
                HopeConnect is dedicated to empowering underserved communities through 
                education, healthcare, and sustainable development initiatives. Our 
                transparent approach ensures every donation creates meaningful impact.
              </p>
              <p className="text-base leading-relaxed text-muted-foreground">
                Together, we're not just changing lives—we're building a foundation 
                for generations to come.
              </p>
            </div>
            
            <div className="rounded-2xl overflow-hidden shadow-lg">
              <img
                src="https://images.unsplash.com/photo-1560220604-1985ebfe28b1"
                alt="Volunteers working together"
                className="w-full h-[400px] object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-semibold mb-6">
            Ready to Make a Difference?
          </h2>
          <p className="text-lg mb-8 opacity-90">
            Join our community of changemakers. Register today and start your journey of giving.
          </p>
          <Button
            data-testid="cta-register-btn"
            onClick={() => navigate("/register")}
            size="lg"
            variant="secondary"
            className="rounded-full px-8 py-6 text-lg font-medium shadow-lg"
          >
            Register Now <Heart className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
