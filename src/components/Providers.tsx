"use client";

import { SessionProvider } from "next-auth/react";
import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <GoogleReCaptchaProvider
        reCaptchaKey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ""}
        scriptProps={{
          async: false,
          defer: false,
          appendTo: "head",
          nonce: undefined,
        }}
      >
        {children}
      </GoogleReCaptchaProvider>
    </SessionProvider>
  );
}