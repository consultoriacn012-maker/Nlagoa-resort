"use client"
import React from 'react';
import { submitLead } from '@/app/actions/leads';

export default function LeadForm({ source }: { source: string }) {
  const [sent, setSent] = React.useState(false);

  async function handle(e: any) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = {
      name: fd.get('name'),
      phone: fd.get('phone'),
      email: fd.get('email'),
      interest: fd.get('interest'),
      message: fd.get('message'),
      lgpd_accepted: true,
      source: source
    };
    await submitLead(data);
    setSent(true);
  }

  if (sent) return <div className="text-center font-bold text-green-600 p-8">Mensagem enviada com sucesso!</div>;

  return (
    <form onSubmit={handle} className="flex flex-col gap-4">
      <input name="name" placeholder="Seu Nome" required className="p-4 border rounded-xl" />
      <input name="phone" placeholder="Seu Telefone" required className="p-4 border rounded-xl" />
      <input name="email" type="email" placeholder="Seu E-mail" required className="p-4 border rounded-xl" />
      <select name="interest" className="p-4 border rounded-xl">
        <option>Desejo ser Sócio Lagoa Lovers</option>
        <option>Reservas em Hotéis</option>
        <option>Ingressos</option>
      </select>
      <textarea name="message" placeholder="Mensagem" className="p-4 border rounded-xl h-32" />
      <button className="bg-[#003366] text-white py-4 rounded-xl font-black uppercase tracking-widest">Enviar</button>
    </form>
  );
}
