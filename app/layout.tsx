import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Formulário Sniper de IA — Suno 2026",
  description: "Avaliação de uso de Inteligência Artificial — Bônus Anual",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  );
}
