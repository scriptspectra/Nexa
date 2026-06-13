"use client";

import { useOrganization } from "@clerk/nextjs";
import { AuthLayout } from "@/modules/auth/ui/layouts/auth-layout";
import { OrgSelectionView } from "@/modules/auth/ui/views/org-selection-view";

export const OrganizationGuard = ({ children }: { children: React.ReactNode; }) => {
  const { organization, isLoaded } = useOrganization();

  if (!isLoaded) {
    return (
      <AuthLayout>
        <p className="text-on-surface-variant text-label-md font-label-md">Loading...</p>
      </AuthLayout>
    );
  }

  if (!organization) {
    return (
      <AuthLayout>
        <OrgSelectionView />
      </AuthLayout>
    );
  }

  return (
    <>
      {children}
    </>
  );
};
