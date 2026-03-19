import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { ThemeToggle } from "./_components/ThemeToggle";

const fontPrimary = Outfit({
  variable: "--font-primary",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "inter filiere IAI",
  description: "Plateforme de suivi en direct d'un tournoi de football inter-classes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${fontPrimary.variable} font-primary antialiased bg-zinc-950 text-zinc-100`}
      >
        {children}
        <ThemeToggle />
      </body>
    </html>
  );
}
