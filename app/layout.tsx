import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lagoa Parque e Hotéis | Caldas Novas",
  description: "O melhor de Caldas Novas",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="scroll-smooth">
      <body>{children}</body>
    </html>
  );
}
