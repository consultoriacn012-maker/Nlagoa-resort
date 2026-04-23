export default function Hero() {
  return (
    <section className="relative h-screen flex items-center justify-center text-white overflow-hidden">
      <div className="absolute inset-0 bg-blue-900">
        <img src="https://images.unsplash.com/photo-1582650625119-3a31f8fa2699?q=80&w=2000" className="w-full h-full object-cover opacity-50" alt="Hero" />
      </div>
      <div className="relative z-10 text-center px-4">
        <h1 className="text-6xl md:text-8xl font-black uppercase mb-6">A vida é melhor <br/><span className="text-[#FFCC00]">na água quente</span></h1>
        <p className="text-xl max-w-2xl mx-auto">O paraíso em Caldas Novas espera por você.</p>
      </div>
    </section>
  );
}
