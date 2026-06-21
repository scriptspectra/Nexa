"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SETTINGS_TABS = [
  { href: "/settings/sla", label: "SLA Config" },
  { href: "/settings/audit-log", label: "Audit Log" },
  { href: "/settings/api-keys", label: "API Keys" },
  { href: "/settings/webhooks", label: "Webhooks" },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <header className="flex-none px-6 py-4 border-b border-outline-variant bg-surface-container-lowest">
        <h1 className="text-display-sm font-display-sm font-bold text-on-surface mb-4">Settings</h1>
        <div className="flex space-x-6">
          {SETTINGS_TABS.map((tab) => {
            const isActive = pathname?.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`pb-2 text-label-md font-label-md border-b-2 transition-colors ${
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-on-surface-variant hover:text-on-surface hover:border-outline"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6 custom-scrollbar bg-surface-container-lowest">
        <div className="max-w-4xl">
          {children}
        </div>
      </div>
    </div>
  );
}
