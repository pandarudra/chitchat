import { MessageCircle, Video, Phone, Shield, Users, Zap } from "lucide-react";

export function FeaturesSection() {
  const features = [
    {
      icon: <MessageCircle className="h-7 w-7" />,
      title: "Instant Messaging",
      description:
        "Send messages instantly with real-time delivery status and typing indicators.",
    },
    {
      icon: <Video className="h-7 w-7" />,
      title: "HD Video Calls",
      description:
        "Crystal clear video calls with picture-in-picture and screen sharing capabilities.",
    },
    {
      icon: <Phone className="h-7 w-7" />,
      title: "Voice Calling",
      description:
        "High-quality voice calls with advanced noise cancellation technology.",
    },
    {
      icon: <Shield className="h-7 w-7" />,
      title: "End-to-End Security",
      description:
        "Your conversations are protected with military-grade encryption.",
    },
    {
      icon: <Users className="h-7 w-7" />,
      title: "Smart Contacts",
      description:
        "Easily manage contacts with online status and smart contact suggestions.",
    },
    {
      icon: <Zap className="h-7 w-7" />,
      title: "Lightning Fast",
      description:
        "Optimized for speed with instant message delivery and seamless performance.",
    },
  ];

  return (
    <section className="py-32 bg-muted/50 border-y border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-24">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
            Everything you need for modern communication
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto font-light">
            ChitChat combines the best of messaging and calling in one
            powerful platform designed for the future of work and play.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group p-8 rounded-3xl bg-background border border-border shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 relative overflow-hidden"
            >
              {/* Subtle hover gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary-50 to-transparent dark:from-primary-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <div className="relative z-10">
                <div className="w-14 h-14 bg-primary-100 dark:bg-primary-900/50 rounded-2xl flex items-center justify-center text-primary-600 dark:text-primary-400 mb-8 shadow-sm border border-primary-200 dark:border-primary-800 transition-transform group-hover:scale-110 duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3 tracking-tight">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed text-sm">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
