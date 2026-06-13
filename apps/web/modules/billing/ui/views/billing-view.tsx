"use client";

import { useOrganization } from "@clerk/nextjs";
import {
  BillingHistory,
  PaymentMethod,
  PricingTable,
  UsageStats,
} from "../components/pricing-table";
import { useBillingDetails } from "../../hooks/use-billing-details";

export const BillingView = () => {
  const { memberships } = useOrganization({
    memberships: {
      pageSize: 10,
      keepPreviousData: true,
    },
  });
  const { details, isLoading, error } = useBillingDetails();

  const seatCount = memberships?.count ?? (memberships as any)?.data?.length ?? 1;
  const maxSeats = details?.isPro ? 5 : 1;

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-xl bg-black">
        <p className="text-on-surface-variant text-label-md font-label-md">
          Loading billing details...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-xl bg-black">
        <p className="text-on-surface-variant text-label-md font-label-md">
          {error}
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-xl custom-scrollbar bg-black">
      <div className="max-w-7xl mx-auto">
        <section className="mb-xl">
          <h2 className="font-headline-lg text-headline-lg text-primary mb-xs">
            Plans & Billing
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Choose the plan that&apos;s right for you
          </p>
        </section>

        <PricingTable details={details} />

        <section className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
          <BillingHistory details={details} />
          <UsageStats
            details={details}
            seatCount={seatCount}
            maxSeats={maxSeats}
          />
        </section>

        <PaymentMethod details={details} />
      </div>
    </div>
  );
};
