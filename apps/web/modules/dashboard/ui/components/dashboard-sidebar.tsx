"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { OrganizationSwitcher, UserButton, useOrganization } from "@clerk/nextjs";


interface NavItem {
  href: string;
  label: string;
  icon: string;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/conversations", label: "Conversations", icon: "chat_bubble" },
  { href: "/analytics", label: "Analytics", icon: "monitoring" },
  { href: "/files", label: "Files", icon: "folder" },
  { href: "/integrations", label: "Integrations", icon: "extension" },
  { href: "/plugins/vapi", label: "Plugins", icon: "settings_applications" },
  { href: "/customization", label: "Widget Settings", icon: "settings" },
  { href: "/billing", label: "Billing", icon: "receipt_long" },
  // Admin-only routes — hidden for org:member
  { href: "/macros", label: "Macros", icon: "quick_reference", adminOnly: true },
  { href: "/settings/sla", label: "Settings", icon: "settings_applications", adminOnly: true },
];

export const DashboardSidebar = ({ onClose }: { onClose?: () => void }) => {
  const pathname = usePathname();
  const { membership } = useOrganization({ membership: true } as any);

  // Clerk: role is "org:admin" | "org:member". Cast safely.
  const role: string | undefined = (membership as any)?.role;
  const isAdmin = !role || role.includes("admin"); // default to showing until loaded

  return (
    <aside className="flex flex-col h-full py-md px-sm bg-background border-r border-outline-variant w-64 shrink-0 overflow-y-auto custom-scrollbar">
      <div className="mb-lg px-xs">
        <h1 className="text-label-md font-label-md font-bold text-primary tracking-widest uppercase mb-1">Zephyra</h1>
        <p className="text-[10px] font-label-sm text-on-surface-variant uppercase tracking-tighter">Enterprise Helpdesk</p>
      </div>



      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin).map((item) => {
          const isActive =
            item.href === "/conversations"
              ? pathname?.includes("/conversations") || pathname === "/"
              : pathname?.startsWith(item.href);

          return (
            <Link key={item.href} href={item.href} onClick={onClose}>
              <div
                className={`flex items-center gap-3 px-sm py-xs rounded-none cursor-pointer transition-all active:scale-[0.98] ${
                  isActive
                    ? "text-primary bg-surface-container-highest border-l-2 border-primary"
                    : "text-on-surface-variant hover:text-primary hover:bg-surface-container-low"
                }`}
              >
                <span className="material-symbols-outlined" data-icon={item.icon}>
                  {item.icon}
                </span>
                <span className="text-label-md font-label-md">{item.label}</span>
                {item.adminOnly && (
                  <span className="ml-auto text-[9px] font-bold uppercase tracking-wider text-primary border border-primary px-1 py-0.5">
                    Admin
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-4">
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
