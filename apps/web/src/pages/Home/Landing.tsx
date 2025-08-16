import { useNavigate } from "react-router-dom";
import {
  MessageCircle,
  Video,
  Phone,
  Shield,
  Zap,
  Users,
  ArrowRight,
  Star,
  Play,
} from "lucide-react";
import { Button } from "../../components/ui/Button";

export const Landing = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <MessageCircle className="h-8 w-8" />,
      title: "Instant Messaging",
      description:
        "Send messages instantly with real-time delivery status and typing indicators.",
    },
    {
      icon: <Video className="h-8 w-8" />,
      title: "HD Video Calls",
      description:
        "Crystal clear video calls with picture-in-picture and screen sharing capabilities.",
    },
    {
      icon: <Phone className="h-8 w-8" />,
      title: "Voice Calling",
      description:
        "High-quality voice calls with advanced noise cancellation technology.",
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "End-to-End Security",
      description:
        "Your conversations are protected with military-grade encryption.",
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Smart Contacts",
      description:
        "Easily manage contacts with online status and smart contact suggestions.",
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: "Lightning Fast",
      description:
        "Optimized for speed with instant message delivery and seamless performance.",
    },
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Product Manager",
      content:
        "ChitChat has revolutionized how our team communicates. The video quality is exceptional!",
      rating: 5,
    },
    {
      name: "Mike Chen",
      role: "Software Engineer",
      content:
        "Finally, a chat app that just works. Simple, fast, and reliable.",
      rating: 5,
    },
    {
      name: "Emily Davis",
      role: "Designer",
      content:
        "Love the clean interface and smooth user experience. It's my go-to messaging app now.",
      rating: 5,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-green-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#ecf39e] to-green-600 rounded-xl flex items-center justify-center">
                <MessageCircle className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">ChitChat</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/login")}
                className="text-gray-600 hover:text-green-600 font-medium transition-colors"
              >
                Sign In
              </button>
              <Button
                onClick={() => navigate("/login")}
                className="bg-green-600 hover:bg-green-700"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-32 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-8 leading-tight">
              Connect with
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600">
                {" "}
                Anyone,{" "}
              </span>
              Anywhere
            </h1>
            <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
              Experience seamless communication with ChitChat's modern messaging
              platform. HD video calls, instant messaging, and secure
              conversations - all in one beautiful app.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                onClick={() => navigate("/login")}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 text-lg  shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
              >
                Start Chatting Now
                <ArrowRight className="h-5 w-5" />
              </Button>
              <button className="flex items-center gap-2 text-gray-600 hover:text-green-600 font-medium transition-colors px-6 py-4">
                <Play className="h-5 w-5" />
                Watch Demo
              </button>
            </div>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-green-200 rounded-full opacity-60 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-32 h-32 bg-blue-200 rounded-full opacity-40 animate-bounce"></div>
        <div className="absolute bottom-20 left-1/4 w-16 h-16 bg-purple-200 rounded-full opacity-50 animate-pulse"></div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Everything you need for modern communication
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              ChitChat combines the best of messaging and calling in one
              powerful platform
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-8 rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-2"
              >
                <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center text-green-600 mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-green-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div className="text-white">
              <div className="text-4xl font-bold mb-2">1M+</div>
              <div className="text-green-100">Active Users</div>
            </div>
            <div className="text-white">
              <div className="text-4xl font-bold mb-2">99.9%</div>
              <div className="text-green-100">Uptime</div>
            </div>
            <div className="text-white">
              <div className="text-4xl font-bold mb-2">50M+</div>
              <div className="text-green-100">Messages Sent</div>
            </div>
            <div className="text-white">
              <div className="text-4xl font-bold mb-2">150+</div>
              <div className="text-green-100">Countries</div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Loved by millions worldwide
            </h2>
            <p className="text-xl text-gray-600">
              See what our users are saying about ChitChat
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300"
              >
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-5 w-5 text-yellow-400 fill-current"
                    />
                  ))}
                </div>
                <p className="text-gray-600 mb-6 italic">
                  "{testimonial.content}"
                </p>
                <div>
                  <div className="font-semibold text-gray-900">
                    {testimonial.name}
                  </div>
                  <div className="text-gray-500 text-sm">
                    {testimonial.role}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-green-600 to-[#4f772d]">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">
            Ready to start your conversation?
          </h2>
          <p className="text-xl text-green-100 mb-12">
            Join millions of users who trust ChitChat for their daily
            communication needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => navigate("/login")}
              className="text-xl h-9 px-6 bg-green-500 hover:bg-green-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Get Started Free
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="border-t border-gray-800 mt-12 pt-8 text-center">
            <p className="text-gray-400">
              © 2025 ChitChat. All rights reserved. Made with ❤️ for better
              communication.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
