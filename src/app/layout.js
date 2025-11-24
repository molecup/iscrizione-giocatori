import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "./components/Header";
import ToastProvider from "./components/ToastProvider";
import {getUserPermissions} from "./lib/auth";

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

export default async function RootLayout({ children }) {
  const user_permissions = await getUserPermissions();
  return (
    <html lang="it">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <ToastProvider>
          <Header user_permissions={user_permissions} />
          <main className="container">
            {children}
          </main>
        </ToastProvider>
      </body>
    </html>
  );
}
