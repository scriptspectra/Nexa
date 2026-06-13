"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";

export const DashboardSidebar = () => {
  const pathname = usePathname();

  return (
    <aside className="flex flex-col h-full py-md px-sm bg-background border-r border-outline-variant w-64 shrink-0">
      <div className="mb-lg px-xs">
        <h1 className="text-label-md font-label-md font-bold text-primary tracking-widest uppercase mb-1">Zephyra</h1>
        <p className="text-[10px] font-label-sm text-on-surface-variant uppercase tracking-tighter">Active: version 2</p>
      </div>

      <nav className="flex-1 space-y-1">
        <Link href="/conversations">
          <div className={`flex items-center gap-3 px-sm py-xs rounded-none cursor-pointer transition-all active:scale-[0.98] ${pathname?.includes('/conversations') || pathname === '/' ? 'text-primary bg-surface-container-highest border-l-2 border-primary' : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-low'}`}>
            <span className="material-symbols-outlined" data-icon="dashboard">dashboard</span>
            <span className="text-label-md font-label-md">Dashboard</span>
          </div>
        </Link>

        <Link href="/conversations">
          <div className={`flex items-center gap-3 px-sm py-xs rounded-none cursor-pointer transition-all active:scale-[0.98] ${pathname?.includes('/conversations') ? 'text-primary bg-surface-container-highest border-l-2 border-primary' : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-low'}`}>
            <span className="material-symbols-outlined" data-icon="chat_bubble">chat_bubble</span>
            <span className="text-label-md font-label-md">Conversations</span>
          </div>
        </Link>

        <Link href="/analytics">
          <div className={`flex items-center gap-3 px-sm py-xs rounded-none cursor-pointer transition-all active:scale-[0.98] ${pathname?.includes('/analytics') ? 'text-primary bg-surface-container-highest border-l-2 border-primary' : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-low'}`}>
            <span className="material-symbols-outlined" data-icon="monitoring">monitoring</span>
            <span className="text-label-md font-label-md">Analytics</span>
          </div>
        </Link>

        <Link href="/customers">
          <div className={`flex items-center gap-3 px-sm py-xs rounded-none cursor-pointer transition-all active:scale-[0.98] ${pathname?.includes('/customers') ? 'text-primary bg-surface-container-highest border-l-2 border-primary' : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-low'}`}>
            <span className="material-symbols-outlined" data-icon="group">group</span>
            <span className="text-label-md font-label-md">Customers</span>
          </div>
        </Link>

        <Link href="/customization">
          <div className={`flex items-center gap-3 px-sm py-xs rounded-none cursor-pointer transition-all active:scale-[0.98] ${pathname?.includes('/customization') ? 'text-primary bg-surface-container-highest border-l-2 border-primary' : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-low'}`}>
            <span className="material-symbols-outlined" data-icon="settings">settings</span>
            <span className="text-label-md font-label-md">Widget Customization</span>
          </div>
        </Link>

        <Link href="/billing">
          <div className={`flex items-center gap-3 px-sm py-xs rounded-none cursor-pointer transition-all active:scale-[0.98] ${pathname?.includes('/billing') ? 'text-primary bg-surface-container-highest border-l-2 border-primary' : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-low'}`}>
            <span className="material-symbols-outlined" data-icon="receipt_long">receipt_long</span>
            <span className="text-label-md font-label-md">Billing</span>
          </div>
        </Link>

        <Link href="/files">
          <div className={`flex items-center gap-3 px-sm py-xs rounded-none cursor-pointer transition-all active:scale-[0.98] ${pathname?.includes('/files') ? 'text-primary bg-surface-container-highest border-l-2 border-primary' : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-low'}`}>
            <span className="material-symbols-outlined" data-icon="folder">folder</span>
            <span className="text-label-md font-label-md">Files</span>
          </div>
        </Link>

        <Link href="/integrations">
          <div className={`flex items-center gap-3 px-sm py-xs rounded-none cursor-pointer transition-all active:scale-[0.98] ${pathname?.includes('/integrations') ? 'text-primary bg-surface-container-highest border-l-2 border-primary' : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-low'}`}>
            <span className="material-symbols-outlined" data-icon="extension">extension</span>
            <span className="text-label-md font-label-md">Integrations</span>
          </div>
        </Link>

        <Link href="/plugins/vapi">
          <div className={`flex items-center gap-3 px-sm py-xs rounded-none cursor-pointer transition-all active:scale-[0.98] ${pathname?.includes('/plugins') ? 'text-primary bg-surface-container-highest border-l-2 border-primary' : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-low'}`}>
            <span className="material-symbols-outlined" data-icon="settings_applications">settings_applications</span>
            <span className="text-label-md font-label-md">Plugins</span>
          </div>
        </Link>
      </nav>

      <div className="mt-auto space-y-4">
        <button className="w-full py-sm text-label-md font-label-md font-bold uppercase tracking-widest hover:bg-on-background transition-colors active:scale-[0.98] bg-surface-container-highest text-primary">
          New Case
        </button>

        <div className="pt-sm border-t border-outline-variant space-y-2">
          <div className="flex items-center gap-3 px-sm py-1 text-on-surface-variant hover:text-primary cursor-pointer text-label-sm font-label-sm">
            <span className="material-symbols-outlined text-[16px]" data-icon="help">help</span>
            <span>Help Center</span>
          </div>
          <div className="flex items-center gap-3 px-sm py-1 text-on-surface-variant hover:text-primary cursor-pointer text-label-sm font-label-sm">
            <span className="material-symbols-outlined text-[16px]" data-icon="check_circle">check_circle</span>
            <span>System Status</span>
          </div>
        </div>

        <div className="pt-sm border-t border-outline-variant">
          <OrganizationSwitcher hidePersonal appearance={{ elements: { rootBox: "w-full" } }} />
          <div className="mt-2 flex justify-center">
            <UserButton />
          </div>
        </div>
      </div>
    </aside>
  );
};
