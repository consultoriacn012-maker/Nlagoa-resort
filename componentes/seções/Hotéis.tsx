export default function Hotels() {
  return (
    <section id="hoteis" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <h2 className="text-4xl font-black text-[#003366] mb-12 uppercase">Nossos Hotéis</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-3xl overflow-hidden shadow-lg p-6">
              <div className="h-48 bg-gray-100 rounded-2xl mb-4 overflow-hidden">
                <img src="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500" className="w-full h-full object-cover" />
              </div>
              <h3 className="font-black text-xl text-[#003366]">LAGOA HOTEL {i}</h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
