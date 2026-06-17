import { useNavigate } from "react-router-dom";
import { MessageCircle, ArrowRight, Play } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { FeaturesSection } from "./components/FeaturesSection";
// import { StatsSection } from "./components/StatsSection";
import { TestimonialsSection } from "./components/TestimonialsSection";
import { ThemeToggle } from "../../components/ui/ThemeToggle";

export const Landing = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate("/chat");
    }
  }, [navigate, isAuthenticated, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="animate-pulse flex items-center space-x-4">
          <div className="h-12 w-12 bg-primary/20 rounded-full"></div>
          <div className="h-6 w-32 bg-primary/20 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas text-ink selection:bg-primary selection:text-on-primary">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-hairline bg-canvas/80 backdrop-blur-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div
              className="flex items-center space-x-3 cursor-pointer"
              onClick={() => navigate("/")}
            >
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shadow-sm">
                <MessageCircle className="h-6 w-6 text-on-primary" />
              </div>
              <h1 className="text-2xl font-display font-400 text-ink">
                ChitChat
              </h1>
            </div>
            <div className="flex items-center space-x-4 sm:space-x-6">
              <button
                onClick={() => navigate("/login")}
                className="text-body hover:text-ink font-500 transition-colors"
              >
                Sign In
              </button>
              <Button
                onClick={() => navigate("/signup")}
                className="bg-primary hover:bg-primary-active text-on-primary shadow-sm hover:shadow-md transition-all"
              >
                Get Started
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-24 pb-32 relative overflow-hidden">
        {/* Subtle Background Accents */}
        <div className="absolute top-0 left-10 w-72 h-72 bg-primary/5 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        <div className="absolute top-20 right-20 w-72 h-72 bg-accent-teal/5 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface-card border border-hairline text-muted text-body mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Have some ChitChat with your close ones
            </div>
            <h1 className="text-display-xl font-display font-400 mb-8 leading-tight text-ink">
              Connect with
              <span className="block text-primary">Anyone, Anywhere</span>
            </h1>
            <p className="text-title-md text-body mb-12 max-w-2xl mx-auto leading-relaxed">
              Experience seamless communication with ChitChat's modern messaging
              platform. HD video calls, instant messaging, and secure
              conversations - all in one beautiful app.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                onClick={() => navigate("/signup")}
                className="bg-primary hover:bg-primary-active text-on-primary px-8 py-3 text-button rounded-md shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex items-center gap-3 w-full sm:w-auto"
              >
                Start Chatting Now
                <ArrowRight className="h-5 w-5" />
              </Button>
              <button className="flex items-center justify-center gap-3 text-ink font-500 hover:bg-surface-card px-8 py-3 rounded-md transition-colors w-full sm:w-auto border border-hairline bg-canvas">
                <Play className="h-5 w-5 text-primary" fill="currentColor" />
                Try it Out
              </button>
            </div>
          </div>
        </div>
      </section>

      <FeaturesSection />
      {/* <StatsSection /> */}
      <TestimonialsSection />

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-surface-dark"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 blur-3xl opacity-40 rounded-full translate-x-1/2 -translate-y-1/2"></div>

        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8 relative z-10">
          <h2 className="text-display-lg font-display font-400 text-on-dark mb-8">
            Ready to start your conversation?
          </h2>
          <p className="text-body-md text-on-dark-soft mb-12 max-w-2xl mx-auto">
            Join millions of users who trust ChitChat for their daily
            communication needs. No credit card required.
          </p>
          <Button
            onClick={() => navigate("/signup")}
            className="text-button px-8 py-3 bg-primary hover:bg-primary-active text-on-primary rounded-md shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
          >
            Get Started for Free
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-surface-dark text-on-dark-soft py-12 border-t border-hairline">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center space-x-3">
              <MessageCircle className="h-6 w-6 text-primary" />
              <span className="text-xl font-display font-400 text-on-dark">
                ChitChat
              </span>
            </div>
            <div className="flex space-x-6 text-body-sm">
              <a
                href="mailto:rudrapanda8206@gmail.com"
                className="hover:text-on-dark transition-colors"
              >
                Contact
              </a>
            </div>
            <p className="text-body-sm">
              © {new Date().getFullYear()} ChitChat. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
