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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse flex items-center space-x-4">
          <div className="h-12 w-12 bg-primary-200 rounded-full"></div>
          <div className="h-6 w-32 bg-primary-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary-500 selection:text-white">
      {/* Header */}
      <header className="glass sticky top-0 z-50 border-b border-border transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate("/")}>
              <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center shadow-md">
                <MessageCircle className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-primary-400">
                ChitChat
              </h1>
            </div>
            <div className="flex items-center space-x-4 sm:space-x-6">
              <button
                onClick={() => navigate("/login")}
                className="text-muted-foreground hover:text-foreground font-medium transition-colors"
              >
                Sign In
              </button>
              <Button
                onClick={() => navigate("/signup")}
                className="bg-primary-600 hover:bg-primary-700 text-white shadow-md hover:shadow-lg transition-all"
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
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 left-10 w-72 h-72 bg-primary-400/30 rounded-full mix-blend-multiply filter blur-3xl dark:opacity-20 animate-blob"></div>
        <div className="absolute top-20 right-20 w-72 h-72 bg-purple-400/30 rounded-full mix-blend-multiply filter blur-3xl dark:opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-400/30 rounded-full mix-blend-multiply filter blur-3xl dark:opacity-20 animate-blob animation-delay-4000"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 text-sm font-medium mb-8 border border-primary-200 dark:border-primary-800">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
              </span>
              {/* v2.0 is now live */}
              Do Have Some ChitChat with your close ones
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-[1.1] tracking-tight">
              Connect with
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-purple-600">
                Anyone, Anywhere
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
              Experience seamless communication with ChitChat's modern messaging
              platform. HD video calls, instant messaging, and secure
              conversations - all in one beautiful app.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                onClick={() => navigate("/signup")}
                className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-6 text-lg rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex items-center gap-3 w-full sm:w-auto"
              >
                Start Chatting Now
                <ArrowRight className="h-5 w-5" />
              </Button>
              <button className="flex items-center justify-center gap-3 text-foreground font-semibold hover:bg-muted px-8 py-5 rounded-2xl transition-colors w-full sm:w-auto border border-border">
                <Play className="h-5 w-5 text-primary-600" fill="currentColor" />
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
        <div className="absolute inset-0 bg-primary-900"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-600 blur-3xl opacity-50 rounded-full translate-x-1/2 -translate-y-1/2"></div>
        
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8 relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-8 tracking-tight">
            Ready to start your conversation?
          </h2>
          <p className="text-xl text-primary-100 mb-12 max-w-2xl mx-auto font-light">
            Join millions of users who trust ChitChat for their daily
            communication needs. No credit card required.
          </p>
          <Button
            onClick={() => navigate("/signup")}
            className="text-lg px-10 py-6 bg-primary-600 hover:bg-primary-500 text-gray-900 font-semibold rounded-2xl shadow-2xl hover:shadow-white/20 transition-all duration-300 hover:-translate-y-1"
          >
            Get Started for Free
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 text-gray-400 py-12 border-t border-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center space-x-3">
              <MessageCircle className="h-6 w-6 text-primary-500" />
              <span className="text-xl font-semibold text-gray-200">ChitChat</span>
            </div>
            <div className="flex space-x-6 text-sm">
              {/* <a href="#" className="hover:text-white transition-colors">Privacy</a> */}
              {/* <a href="#" className="hover:text-white transition-colors">Terms</a> */}
              <a href="mailto:rudrapanda8206@gmail.com" className="hover:text-white transition-colors">Contact</a>
            </div>
            <p className="text-sm">
              © {new Date().getFullYear()} ChitChat. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
