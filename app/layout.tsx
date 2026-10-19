import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Estúdio de Posts",
  description: "Templates, pilares, público e samples para gerar ideias de posts com a sua própria chave de IA.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
