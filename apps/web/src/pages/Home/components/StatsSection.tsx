export function StatsSection() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-primary-600 dark:bg-primary-900"></div>
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary-400 blur-3xl opacity-50 rounded-full translate-x-1/2 -translate-y-1/2"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid md:grid-cols-4 gap-8 md:gap-12 text-center divide-y md:divide-y-0 md:divide-x divide-primary-400/30">
          <div className="py-6 md:py-0">
            <div className="text-5xl font-bold mb-3 tracking-tight text-white drop-shadow-sm">1M+</div>
            <div className="text-primary-100 font-medium tracking-wide uppercase text-sm">Active Users</div>
          </div>
          <div className="py-6 md:py-0">
            <div className="text-5xl font-bold mb-3 tracking-tight text-white drop-shadow-sm">99.9%</div>
            <div className="text-primary-100 font-medium tracking-wide uppercase text-sm">Uptime</div>
          </div>
          <div className="py-6 md:py-0">
            <div className="text-5xl font-bold mb-3 tracking-tight text-white drop-shadow-sm">50M+</div>
            <div className="text-primary-100 font-medium tracking-wide uppercase text-sm">Messages Sent</div>
          </div>
          <div className="py-6 md:py-0">
            <div className="text-5xl font-bold mb-3 tracking-tight text-white drop-shadow-sm">150+</div>
            <div className="text-primary-100 font-medium tracking-wide uppercase text-sm">Countries</div>
          </div>
        </div>
      </div>
    </section>
  );
}
