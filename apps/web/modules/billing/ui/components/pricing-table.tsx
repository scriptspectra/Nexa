"use client";

import { useOrganization } from "@clerk/nextjs";
import { CheckIcon, SparklesIcon } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { useSubscription } from "../../hooks/use-subscription";
import { toast } from "sonner";
import { useEffect } from "react";

export const PricingTable = () => {
  const { organization, isLoaded: isOrgLoaded } = useOrganization();
  const { isPro, isLoading } = useSubscription();

  const checkoutBaseUrl = process.env.NEXT_PUBLIC_LEMON_SQUEEZY_CHECKOUT_URL || "";

  useEffect(() => {
    // Load Lemon Squeezy JS library dynamically
    if (typeof window !== "undefined") {
      const scriptId = "lemonsqueezy-js";
      if (!document.getElementById(scriptId)) {
        const script = document.createElement("script");
        script.id = scriptId;
        script.src = "https://assets.lemonsqueezy.com/lemon.js";
        script.defer = true;
        script.onload = () => {
          if ((window as any).LemonSqueezy) {
            (window as any).LemonSqueezy.Setup();
          }
        };
        document.body.appendChild(script);
      } else {
        if ((window as any).LemonSqueezy) {
          (window as any).LemonSqueezy.Setup();
        }
      }
    }
  }, []);

  const handleUpgrade = () => {
    if (!isOrgLoaded) return;

    if (!organization) {
      toast.error("Please create or select an organization first before upgrading.");
      return;
    }

    if (!checkoutBaseUrl) {
      toast.error("Lemon Squeezy checkout URL is not configured. Please set NEXT_PUBLIC_LEMON_SQUEEZY_CHECKOUT_URL in your environment.");
      return;
    }

    // Append organizationId to the checkout link as a custom parameter so the webhook can identify the organization
    const checkoutUrl = new URL(checkoutBaseUrl);
    checkoutUrl.searchParams.append("checkout[custom][organizationId]", organization.id);
    
    // Open in Lemon Squeezy secure overlay modal if loaded, else fallback to new tab
    if ((window as any).LemonSqueezy) {
      (window as any).LemonSqueezy.Url.Open(checkoutUrl.toString());
    } else {
      window.open(checkoutUrl.toString(), "_blank");
    }
  };

  const starterFeatures = [
    "24/7 AI Customer Support (limited runs)",
    "1 User / Operator seat",
    "Basic chat widget customization",
    "24-hour conversation history",
  ];

  const proFeatures = [
    "Unlimited AI Customer Support runs",
    "AI Voice Agent integration (Vapi)",
    "Custom RAG Knowledge Base training",
    "Up to 5 operator seats",
    "Premium custom widget branding",
    "30-day conversation history",
    "Priority business support",
  ];

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {/* Starter Plan */}
      <Card className="relative flex flex-col justify-between border bg-background shadow-sm transition-transform hover:-translate-y-1 hover:shadow-md">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Starter</CardTitle>
          <CardDescription>Perfect for testing and personal landing pages.</CardDescription>
          <div className="mt-4 flex items-baseline text-foreground">
            <span className="text-4xl font-extrabold tracking-tight">$0</span>
            <span className="ml-1 text-muted-foreground text-sm">/month</span>
          </div>
        </CardHeader>
        <CardContent className="flex-grow">
          <ul className="space-y-3 text-sm">
            {starterFeatures.map((feature) => (
              <li key={feature} className="flex items-start gap-2">
                <CheckIcon className="mt-0.5 size-4 text-emerald-500 shrink-0" />
                <span className="text-muted-foreground">{feature}</span>
              </li>
            ))}
          </ul>
        </CardContent>
        <CardFooter className="mt-6">
          <Button variant="outline" className="w-full" disabled={isLoading || !isPro}>
            {isLoading ? "Loading..." : !isPro ? "Current Plan" : "Free Plan"}
          </Button>
        </CardFooter>
      </Card>

      {/* Pro Plan */}
      <Card className="relative flex flex-col justify-between border-2 border-primary bg-background shadow-md transition-transform hover:-translate-y-1 hover:shadow-lg">
        {/* Glow badge */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground flex items-center gap-1 shadow-sm">
          <SparklesIcon className="size-3" />
          POPULAR
        </div>

        <CardHeader className="pt-6">
          <CardTitle className="text-xl font-bold">Professional</CardTitle>
          <CardDescription>Unlocks voice agents, customizations, and limitless support.</CardDescription>
          <div className="mt-4 flex items-baseline text-foreground">
            <span className="text-4xl font-extrabold tracking-tight">$19</span>
            <span className="ml-1 text-muted-foreground text-sm">/month</span>
          </div>
        </CardHeader>
        <CardContent className="flex-grow">
          <ul className="space-y-3 text-sm">
            {proFeatures.map((feature) => (
              <li key={feature} className="flex items-start gap-2">
                <CheckIcon className="mt-0.5 size-4 text-emerald-500 shrink-0" />
                <span className="text-foreground">{feature}</span>
              </li>
            ))}
          </ul>
        </CardContent>
        <CardFooter className="mt-6">
          <Button 
            className="w-full font-semibold shadow-sm transition-all bg-primary hover:bg-primary/95 text-primary-foreground" 
            onClick={handleUpgrade}
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : isPro ? "Active Plan" : "Upgrade to Pro"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};