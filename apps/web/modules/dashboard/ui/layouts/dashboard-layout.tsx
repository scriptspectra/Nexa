import { AuthGuard } from "@/modules/auth/ui/components/auth-guard"
import { OrganizationGuard } from "@/modules/auth/ui/components/organization-guard"
import { DashboardSidebar } from "@/modules/dashboard/ui/components/dashboard-sidebar";
import { Provider } from "jotai";

import { OnboardingChecklist } from "@/modules/dashboard/ui/components/onboarding-checklist";
import { PWAInstallButton } from "@/modules/dashboard/ui/components/pwa-install-button";

export const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <AuthGuard>
      <OrganizationGuard>
        <Provider>
        <div className="flex h-screen w-full bg-background overflow-hidden selection:bg-primary selection:text-on-primary">
            <DashboardSidebar />
            <main className="flex-1 flex flex-col min-w-0 bg-black">
              <header className="flex justify-between items-center px-gutter w-full sticky top-0 z-40 h-16 bg-background border-b border-outline-variant">
                <div className="flex items-center gap-xl">
                  <span className="text-label-md font-label-md font-bold text-primary uppercase tracking-widest">Zephyra</span>
                  <div className="hidden md:flex gap-md">
                    <a className="text-on-surface-variant hover:text-primary transition-colors text-label-md font-label-md" href="#">Queue</a>
                    <a className="text-on-surface-variant hover:text-primary transition-colors text-label-md font-label-md" href="#">SLA Status</a>
                    <a className="text-on-surface-variant hover:text-primary transition-colors text-label-md font-label-md" href="#">History</a>
                  </div>
                </div>
                <div className="flex items-center gap-md">
                  <PWAInstallButton />
                  <OnboardingChecklist />
                </div>
              </header>
              <div className="flex-1 overflow-hidden flex flex-col relative">
                {children}
              </div>
            </main>
          </div>
        </Provider>
      </OrganizationGuard>
    </AuthGuard>
  );
};
