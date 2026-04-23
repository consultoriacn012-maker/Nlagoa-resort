export default function Attractions() {
  return (
    <section id="parque" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-4xl font-black text-[#003366] mb-12 uppercase text-center">Nossas Atrações</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="h-96 rounded-3xl bg-gray-200 overflow-hidden relative">
            <img src="https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800" className="w-full h-full object-cover" />
            <div className="absolute bottom-0 p-8 text-white font-black text-2xl">LAGOA TERMAS PARQUE</div>
          </div>
          <div className="h-96 rounded-3xl bg-gray-200 overflow-hidden relative">
            <img src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800" className="w-full h-full object-cover" />
            <div className="absolute bottom-0 p-8 text-white font-black text-2xl">LAGOA ECO PRAIA</div>
          </div>
        </div>
      </div>
    </section>
  );
}
