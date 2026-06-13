import { useOrganization } from "@clerk/nextjs";
import { useAction } from "convex/react";
import { api } from "@workspace/backend/_generated/api";
import { useEffect, useState } from "react";

export type BillingDetails = {
  isPro: boolean;
  canPurchase: boolean;
  planName: string;
  planPrice: string;
  status: string;
  statusFormatted: string;
  productName?: string;
  variantName?: string;
  renewsAt?: number;
  renewsAtLabel: string | null;
  endsAt?: number;
  paymentMethod: {
    brand: string;
    lastFour: string;
    label: string;
  } | null;
  updatePaymentMethodUrl: string | null;
  customerPortalUrl: string | null;
  invoices: Array<{
    id: string;
    date: string;
    description: string;
    amount: string;
    invoiceUrl: string | null;
    status: string;
  }>;
};

export const useBillingDetails = () => {
  const { organization, isLoaded: isOrgLoaded } = useOrganization();
  const syncAndGetDetails = useAction(api.private.billing.syncAndGetDetails);
  const [details, setDetails] = useState<BillingDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOrgLoaded) {
      return;
    }

    if (!organization?.id) {
      setDetails(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const loadDetails = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await syncAndGetDetails({ organizationId: organization.id });
        if (!cancelled) {
          setDetails(result);
        }
      } catch (loadError) {
        console.error(loadError);
        if (!cancelled) {
          setError("Failed to load billing details");
          setDetails(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadDetails();

    return () => {
      cancelled = true;
    };
  }, [isOrgLoaded, organization?.id, syncAndGetDetails]);

  return {
    details,
    isLoading: !isOrgLoaded || isLoading,
    error,
  };
};
