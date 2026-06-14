import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@workspace/ui/globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "@workspace/ui/components/sonner";
import { ClerkProvider } from "@clerk/nextjs";

// Pick the correct Clerk publishable key based on the build environment.
// NEXT_PUBLIC_ vars are baked in at build time, so both values are embedded
// in the bundle and the correct one is selected by NODE_ENV at build time.
const clerkPublishableKey =
  process.env.NODE_ENV === "production"
    ? process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY_PROD!
    : process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY_DEV!;

const fontSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Zephyra",
  description: "Zephyra Interface",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
        <style dangerouslySetInnerHTML={{
          __html: `
          .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24;
            font-size: 20px;
          }
        `}} />
      </head>
      <body className={`${fontSans.variable} ${fontMono.variable} antialiased`}>
        <ClerkProvider
          publishableKey={clerkPublishableKey}
          appearance={{
            variables: {
              colorPrimary: "#ffffff"
            }
          }}
        >
          <Providers>
            <Toaster />
            {children}
          </Providers>
        </ClerkProvider>
      </body>
    </html>
  );
}
