import { Star } from "lucide-react";

export function TestimonialsSection() {
  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Product Manager",
      content:"lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quod. Quisquam, quod.",
      rating: 5,
      avatar: "https://api.dicebear.com/9.x/notionists/svg?seed=Sarah"
    },
    {
      name: "Mike Chen",
      role: "Software Engineer",
      rating: 5,
      content:"lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quod. Quisquam, quod.",rating: 5,
      avatar: "https://api.dicebear.com/9.x/notionists/svg?seed=Mike"
    },
    {
      name: "Emily Davis",
      role: "Designer",
      rating: 5,
      avatar: "https://api.dicebear.com/9.x/notionists/svg?seed=Emily",
      content:"lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quod. Quisquam, quod.",
    },
  ];

  return (
    <section className="py-32 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 text-sm font-medium mb-6 border border-primary-200 dark:border-primary-800">
            <Star className="h-4 w-4 fill-current" />
            Loved by users
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
            Don't just take our word for it
          </h2>
          <p className="text-xl text-muted-foreground font-light">
            See what our community has to say about ChitChat
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="glass-panel p-8 rounded-3xl relative overflow-hidden group hover:-translate-y-2 transition-all duration-300"
            >
              {/* Decorative accent */}
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>
              </div>

              <div className="flex mb-6 space-x-1">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star
                    key={i}
                    className="h-5 w-5 text-yellow-400 fill-current drop-shadow-sm"
                  />
                ))}
              </div>
              <p className="text-foreground leading-relaxed mb-8 font-light relative z-10 text-lg">
                "{testimonial.content}"
              </p>
              
              <div className="flex items-center gap-4 mt-auto">
                <img 
                  src={testimonial.avatar} 
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full bg-primary-100 border-2 border-border" 
                />
                <div>
                  <div className="font-bold tracking-tight">
                    {testimonial.name}
                  </div>
                  <div className="text-primary-600 dark:text-primary-400 text-sm font-medium">
                    {testimonial.role}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
