"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@workspace/ui/components/button";

export const PWAInstallButton = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the default browser mini-infobar from showing
      e.preventDefault();
      // Save the event so it can be triggered later
      setDeferredPrompt(e);
      // Update UI to notify user app can be installed
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Check if already in standalone display mode (already installed)
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstallable(false);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    // Show the browser install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);
    // We've used the prompt, and can't use it again
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  if (!isInstallable) return null;

  return (
    <Button 
      variant="outline"
      size="sm"
      className="text-xs bg-surface-container-high border-outline-variant hover:bg-surface-container-highest cursor-pointer text-white flex items-center gap-1.5 h-8 rounded-full"
      onClick={handleInstallClick}
    >
      <span className="material-symbols-outlined text-[14px]">download</span>
      <span>Install App</span>
    </Button>
  );
};
