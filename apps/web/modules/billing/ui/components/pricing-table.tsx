"use client";

import { useOrganization } from "@clerk/nextjs";
import { toast } from "sonner";
import { useEffect } from "react";
import type { BillingDetails } from "../../hooks/use-billing-details";
import { useQuery } from "convex/react";
import { api } from "@workspace/backend/_generated/api";

const STARTER_FEATURES = [
  "24/7 AI Support (Limited runs)",
  "1 User seat",
  "Basic customization",
  "24-hour history",
];

const PRO_FEATURES_LEFT = [
  "Unlimited AI runs",
  "AI Voice Agent (Vapi)",
  "Custom RAG Knowledge Base",
  "Up to 5 operator seats",
];

const PRO_FEATURES_RIGHT = [
  "Premium branding",
  "30-day history",
  "Priority support",
];

type PricingTableProps = {
  details: BillingDetails | null;
};

export const PricingTable = ({ details }: PricingTableProps) => {
  const { organization, isLoaded: isOrgLoaded } = useOrganization();
  const isPro = details?.isPro ?? false;
  const canPurchase = details?.canPurchase ?? true;

  const checkoutBaseUrl = process.env.NEXT_PUBLIC_LEMON_SQUEEZY_CHECKOUT_URL || "";

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

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
      return;
    }

    if ((window as any).LemonSqueezy) {
      (window as any).LemonSqueezy.Setup();
    }
  }, []);

  const handleUpgrade = () => {
    if (!isOrgLoaded) {
      return;
    }

    if (!canPurchase) {
      toast.message("You already have an active plan for this billing period.");
      return;
    }

    if (!organization) {
      toast.error("Please create or select an organization first before upgrading.");
      return;
    }

    if (!checkoutBaseUrl) {
      toast.error("Lemon Squeezy checkout URL is not configured.");
      return;
    }

    const checkoutUrl = new URL(checkoutBaseUrl);
    checkoutUrl.searchParams.append("checkout[custom][organizationId]", organization.id);

    if ((window as any).LemonSqueezy) {
      (window as any).LemonSqueezy.Url.Open(checkoutUrl.toString());
    } else {
      window.open(checkoutUrl.toString(), "_blank");
    }
  };

  const proPlanLabel = details?.variantName || details?.productName || "Professional";
  const proPlanPrice = details?.planPrice || "$19";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter mb-xl">
      <div className="lg:col-span-5 border border-outline-variant bg-surface-container-low p-lg flex flex-col transition-all hover:border-outline duration-300">
        <div className="mb-lg">
          <div className="text-on-surface-variant font-label-md text-label-md uppercase tracking-widest mb-base">
            Tier I
          </div>
          <h3 className="font-headline-sm text-headline-sm text-primary">Starter</h3>
          <div className="mt-md flex items-baseline gap-xs">
            <span className="font-headline-lg text-headline-lg text-primary">$0</span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">/month</span>
          </div>
        </div>
        <ul className="space-y-sm mb-xl flex-grow">
          {STARTER_FEATURES.map((feature) => (
            <li key={feature} className="flex items-start gap-sm font-body-sm text-body-sm text-on-surface">
              <span className="material-symbols-outlined text-outline-variant text-[20px]">check</span>
              {feature}
            </li>
          ))}
        </ul>
        <button
          type="button"
          disabled={!isPro}
          className="w-full bg-surface-container text-primary border border-outline-variant font-label-md py-sm hover:bg-surface-container-high transition-colors disabled:opacity-60"
        >
          {!isPro ? "Current Plan" : "Free Plan"}
        </button>
      </div>

      <div className="lg:col-span-7 border-2 border-primary bg-surface-container-high p-lg flex flex-col relative overflow-hidden transition-all duration-300">
        <div className="absolute top-0 right-0 bg-primary text-on-primary px-sm py-base font-label-sm text-label-sm uppercase tracking-tighter">
          Popular Choice
        </div>

        <div className="mb-lg">
          <div className="text-secondary font-label-md text-label-md uppercase tracking-widest mb-base">
            Tier II
          </div>
          <div className="flex items-center gap-sm">
            <h3 className="font-headline-sm text-headline-sm text-primary">{proPlanLabel}</h3>
            {isPro && (
              <span className="px-xs py-[2px] rounded-full bg-secondary-container/20 text-secondary text-[10px] font-bold border border-secondary/30 uppercase">
                {details?.statusFormatted || "Active"}
              </span>
            )}
          </div>
          <div className="mt-md flex items-baseline gap-xs">
            <span className="font-headline-lg text-headline-lg text-primary">{proPlanPrice}</span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">/month</span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-md mb-xl">
          <ul className="space-y-sm">
            {PRO_FEATURES_LEFT.map((feature) => (
              <li key={feature} className="flex items-start gap-sm font-body-sm text-body-sm text-on-surface">
                <span className="material-symbols-outlined text-secondary text-[20px]">verified</span>
                {feature}
              </li>
            ))}
          </ul>
          <ul className="space-y-sm">
            {PRO_FEATURES_RIGHT.map((feature) => (
              <li key={feature} className="flex items-start gap-sm font-body-sm text-body-sm text-on-surface">
                <span className="material-symbols-outlined text-secondary text-[20px]">verified</span>
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <button
          type="button"
          onClick={handleUpgrade}
          disabled={!canPurchase}
          className="w-full bg-primary text-on-primary font-bold py-sm hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isPro && !canPurchase
            ? "Active Plan"
            : isPro
              ? "Renew Plan"
              : "Upgrade to Pro"}
        </button>
      </div>
    </div>
  );
};

type BillingHistoryProps = {
  details: BillingDetails | null;
};

export const BillingHistory = ({ details }: BillingHistoryProps) => {
  const invoices = details?.invoices ?? [];

  const handleDownload = (invoiceUrl: string | null) => {
    if (!invoiceUrl) {
      toast.error("Invoice download link is not available yet");
      return;
    }

    window.open(invoiceUrl, "_blank", "noopener,noreferrer");
  };

  const handleDownloadAll = () => {
    const downloadableInvoices = invoices.filter((invoice) => invoice.invoiceUrl);

    if (downloadableInvoices.length === 0) {
      toast.error("No invoice download links available yet");
      return;
    }

    downloadableInvoices.forEach((invoice) => {
      if (invoice.invoiceUrl) {
        window.open(invoice.invoiceUrl, "_blank", "noopener,noreferrer");
      }
    });
  };

  return (
    <div className="lg:col-span-8 border border-outline-variant p-lg">
      <div className="flex justify-between items-center mb-md">
        <h4 className="font-headline-sm text-headline-sm text-primary">Billing History</h4>
        {invoices.length > 0 && (
          <button
            type="button"
            onClick={handleDownloadAll}
            className="text-label-md font-label-md text-on-surface-variant hover:text-primary transition-colors"
          >
            Download All
          </button>
        )}
      </div>

      {invoices.length > 0 ? (
        <div className="space-y-base">
          {invoices.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between py-sm border-b border-surface-container-highest last:border-b-0"
            >
              <div className="flex items-center gap-md min-w-0">
                <span className="font-label-sm text-on-surface-variant shrink-0">{entry.date}</span>
                <span className="font-body-sm text-on-surface truncate">{entry.description}</span>
              </div>
              <div className="flex items-center gap-lg shrink-0">
                <span className="font-label-md text-primary">{entry.amount}</span>
                <button
                  type="button"
                  onClick={() => handleDownload(entry.invoiceUrl)}
                  className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors"
                  aria-label={`Download invoice for ${entry.description}`}
                >
                  download
                </button>
                <button
                  type="button"
                  onClick={() => window.open(entry.invoiceUrl, "_blank", "noopener,noreferrer")}
                  className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors"
                  aria-label={`Print invoice for ${entry.description}`}
                >
                  print
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          {details?.isPro
            ? "No invoices synced yet. They will appear after your Lemon Squeezy payment."
            : "No billing history yet. Upgrade to Professional to see invoices here."}
        </p>
      )}
    </div>
  );
};

type UsageStatsProps = {
  details: BillingDetails | null;
  seatCount: number;
  maxSeats: number;
};

export const UsageStats = ({ details, seatCount, maxSeats }: UsageStatsProps) => {
  const { organization } = useOrganization();
  const isPro = details?.isPro ?? false;
  const seatProgress = maxSeats > 0 ? Math.min((seatCount / maxSeats) * 100, 100) : 0;

  const usage = useQuery(
    api.private.usage.getCurrentUsage,
    organization?.id ? { organizationId: organization.id } : "skip"
  );

  const aiRunsCount = usage?.aiResponsesCount || 0;
  const aiRunsLimit = usage?.limit || 100;
  const aiProgress = Math.min((aiRunsCount / aiRunsLimit) * 100, 100);

  return (
    <div className="lg:col-span-4 space-y-gutter">
      <div className="border border-outline-variant p-md bg-surface-container-lowest">
        <h5 className="font-label-md text-on-surface-variant mb-sm uppercase tracking-wider">
          Usage Stats
        </h5>
        <div className="space-y-md">
          <div>
            <div className="flex justify-between font-label-sm text-on-surface mb-xs">
              <span>AI Runs</span>
              <span>{aiRunsCount} of {aiRunsLimit}</span>
            </div>
            <div className="h-1 w-full bg-surface-container-highest">
              <div 
                className="h-full bg-secondary transition-all" 
                style={{ width: `${aiProgress}%` }} 
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between font-label-sm text-on-surface mb-xs">
              <span>Seats</span>
              <span>{seatCount} of {maxSeats}</span>
            </div>
            <div className="h-1 w-full bg-surface-container-highest">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${seatProgress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="relative h-32 w-full overflow-hidden border border-outline-variant bg-surface-container-low">
        <div className="absolute inset-0 bg-gradient-to-t from-surface to-transparent" />
        <div className="absolute bottom-md left-md">
          <p className="font-label-sm text-primary uppercase">
            {isPro
              ? `${details?.statusFormatted || "Active"} · ${details?.variantName || "Professional"}`
              : "Starter plan active"}
          </p>
          {details?.renewsAtLabel && (
            <p className="font-label-sm text-on-surface-variant mt-1">
              Renews {details.renewsAtLabel}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

type PaymentMethodProps = {
  details: BillingDetails | null;
};

export const PaymentMethod = ({ details }: PaymentMethodProps) => {
  if (!details?.isPro || !details.paymentMethod) {
    return null;
  }

  const openUrl = (url: string | null, fallbackMessage: string) => {
    if (!url) {
      toast.message(fallbackMessage);
      return;
    }

    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <section className="mt-xl border border-outline-variant p-lg bg-surface-container-low">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-md">
        <div className="flex items-center gap-md">
          <div className="h-12 w-16 bg-surface border border-outline-variant flex items-center justify-center">
            <span className="material-symbols-outlined text-on-surface-variant">credit_card</span>
          </div>
          <div>
            <p className="font-body-md text-primary">{details.paymentMethod.label}</p>
            <p className="font-label-sm text-on-surface-variant">
              {details.renewsAtLabel
                ? `Renews ${details.renewsAtLabel}`
                : details.statusFormatted}
            </p>
          </div>
        </div>
        <div className="flex gap-sm">
          <button
            type="button"
            onClick={() =>
              openUrl(
                details.updatePaymentMethodUrl,
                "Payment method updates are managed in the Lemon Squeezy customer portal",
              )
            }
            className="px-sm py-xs border border-outline-variant text-label-md hover:border-primary transition-colors"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() =>
              openUrl(
                details.customerPortalUrl,
                "Manage billing in the Lemon Squeezy customer portal",
              )
            }
            className="px-sm py-xs border border-outline-variant text-label-md hover:border-error hover:text-error transition-colors"
          >
            Remove
          </button>
        </div>
      </div>
    </section>
  );
};
