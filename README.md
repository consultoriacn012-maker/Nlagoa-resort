"use client"
import React, { useState, useEffect } from 'react';
import { Users, Menu } from 'lucide-react';

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handle = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handle);
    return () => window.removeEventListener('scroll', handle);
  }, []);

  return (
    <header className={`fixed w-full z-50 transition-all ${scrolled ? 'bg-white shadow-md py-2' : 'bg-transparent py-4'}`}>
      <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
        <div className={`text-2xl font-black ${scrolled ? 'text-[#003366]' : 'text-white'}`}>
          LAGOA<span className="text-[#FF6600]">.</span>
        </div>
        <div className="flex items-center gap-4">
          <a href="tel:6435136230" className="bg-[#FF6600] text-white px-5 py-2 rounded-xl flex items-center gap-3 shadow-lg hover:scale-105 transition-all">
            <Users size={20} />
            <div className="flex flex-col leading-none">
              <span className="text-[10px] font-bold uppercase">Seja Sócio</span>
              <span className="text-sm font-black">(64) 3513-6230</span>
            </div>
          </a>
        </div>
      </div>
    </header>
  );
}
