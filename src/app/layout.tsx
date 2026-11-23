import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vanessa Carla — Estética & cuidado",
  description: "Cílios, Lash Lifting e Brow Lamination para realçar sua beleza natural.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
