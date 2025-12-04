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
      <body className={inter.className}>
        <Providers>
          <RecaptchaForce /> {/* <--- ADD THIS HERE */}
          {children}
        </Providers>
      </body>
    </html>
  );
}