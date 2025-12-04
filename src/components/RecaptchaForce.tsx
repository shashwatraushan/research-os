"use client";
import { useEffect } from "react";

export const RecaptchaForce = () => {
  useEffect(() => {
    // Function to force visibility
    const forceBadge = () => {
      const badge = document.querySelector('.grecaptcha-badge') as HTMLElement;
      if (badge) {
        badge.style.visibility = 'visible';
        badge.style.opacity = '1';
        badge.style.zIndex = '2147483647';
        badge.style.display = 'block';
      }
    };

    // Run immediately and every 500ms to fight any "vanishing" scripts
    forceBadge();
    const interval = setInterval(forceBadge, 500);

    return () => clearInterval(interval);
  }, []);

  return null; // Renders nothing visible itself
};