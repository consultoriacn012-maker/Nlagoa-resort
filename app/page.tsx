import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/sections/Hero";
import Attractions from "@/components/sections/Attractions";
import Hotels from "@/components/sections/Hotels";
import LoversCTA from "@/components/sections/LoversCTA";
import LeadForm from "@/components/ui/LeadForm";
import WhatsApp from "@/components/ui/WhatsApp";

export default function Home() {
  return (
    <main>
      <Header />
      <Hero />
      <Attractions />
      <section id="lovers" className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <LoversCTA />
        </div>
      </section>
      <Hotels />
      <section id="contato" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 grid lg:grid-cols-2 gap-16">
          <div>
            <h2 className="text-5xl font-black text-[#003366] uppercase mb-8">Fale Conosco</h2>
            <p className="text-xl text-gray-600 mb-8 font-bold">(64) 3513-6230</p>
          </div>
          <div className="bg-white p-8 rounded-3xl shadow-xl">
            <LeadForm source="Home" />
          </div>
        </div>
      </section>
      <Footer />
      <WhatsApp />
    </main>
  );
}
