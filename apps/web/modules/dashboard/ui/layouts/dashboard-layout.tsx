"use client";

import { useState } from "react";
import { AuthGuard } from "@/modules/auth/ui/components/auth-guard"
import { OrganizationGuard } from "@/modules/auth/ui/components/organization-guard"
import { DashboardSidebar } from "@/modules/dashboard/ui/components/dashboard-sidebar";
import { Provider } from "jotai";

import { OnboardingChecklist } from "@/modules/dashboard/ui/components/onboarding-checklist";
import { PWAInstallButton } from "@/modules/dashboard/ui/components/pwa-install-button";

export const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <AuthGuard>
      <OrganizationGuard>
        <Provider>
        <div className="flex h-screen w-full bg-background overflow-hidden selection:bg-primary selection:text-on-primary relative">
            {/* Sidebar backdrop for mobile */}
            {isSidebarOpen && (
              <div 
                className="fixed inset-0 bg-black/60 z-40 md:hidden transition-opacity"
                onClick={() => setIsSidebarOpen(false)}
              />
            )}

            {/* Sidebar container */}
            <div className={`
              fixed inset-y-0 left-0 z-50 transform md:relative md:translate-x-0 transition-transform duration-200 ease-in-out
              ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
              md:flex md:w-64 md:shrink-0 h-full
            `}>
              <DashboardSidebar onClose={() => setIsSidebarOpen(false)} />
            </div>

            <main className="flex-1 flex flex-col min-w-0 bg-black h-full">
              <header className="flex justify-between items-center px-gutter w-full sticky top-0 z-30 h-16 bg-background border-b border-outline-variant">
                <div className="flex items-center gap-md md:gap-xl">
                  {/* Hamburger menu button */}
                  <button 
                    onClick={() => setIsSidebarOpen(true)}
                    className="md:hidden p-1.5 -ml-1 text-on-surface-variant hover:text-primary transition-colors cursor-pointer rounded-md hover:bg-surface-container"
                  >
                    <span className="material-symbols-outlined text-[20px]">menu</span>
                  </button>

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
