import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { RecaptchaForce } from "@/components/RecaptchaForce"; // <--- IMPORT THIS

// We use Inter because it is stable and boring (fewer errors than Geist)
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Research OS",
  description: "One-platform research site",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* NUCLEAR FIX: Force reCAPTCHA Visibility */}
        <style>{`
          .grecaptcha-badge { 
            visibility: visible !important;
            opacity: 1 !important;
            z-index: 2147483647 !important;
            display: block !important;
            position: fixed !important;
            bottom: 14px !important;
            right: 10px !important;
            pointer-events: auto !important;
          }
        `}</style>
      </head>
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}