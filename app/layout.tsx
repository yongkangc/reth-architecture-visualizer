import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/layouts/Navigation";
import AnimatedBackground from "@/components/ui/AnimatedBackground";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Reth Architecture Interactive Guide",
  description: "Interactive visualization for understanding Reth's architecture and systems",
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico' }
    ],
    shortcut: '/favicon.ico',
    apple: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased bg-[#141414] text-white`}
      >
        <AnimatedBackground />
        <Navigation />
        <main className="relative min-h-screen">
          <div className="pt-16 lg:pt-0 lg:ml-72">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}