import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: "Agenda de mon CDL",
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