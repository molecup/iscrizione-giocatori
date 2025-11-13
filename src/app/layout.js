import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "./components/Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Iscrizione giocatori — Lega Cittadina",
  description: "Frontend minimal Next.js per gestione squadre e registrazione giocatori.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="it">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <Header />
        <main className="container">
          {children}
        </main>
      </body>
    </html>
  );
}
