import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agenda de disponibilités",
  description: "Consultez les créneaux disponibles pour un rendez-vous.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="bg-slate-50 text-slate-900 min-h-screen">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
