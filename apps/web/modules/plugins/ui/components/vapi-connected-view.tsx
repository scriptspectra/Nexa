"use client";

import { BotIcon, PhoneIcon, SettingsIcon, UnplugIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import { VapiPhoneNumbersTab } from "./vapi-phone-numbers-tab";
import { VapiAssistantsTab } from "./vapi-assistants-tab";

interface VapiConnectedViewProps {
  onDisconnect: () => void;
};

export const VapiConnectedView = ({ onDisconnect }: VapiConnectedViewProps) => {
  const [activeTab, setActiveTab] = useState("phone-numbers");

  return (
    <div className="space-y-6">
      {/* Vapi Connection Status Card */}
      <Card className="border border-white/5 bg-zinc-950/40 backdrop-blur-xl shadow-2xl rounded-2xl overflow-hidden relative">
        <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
        <CardHeader className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex size-14 items-center justify-center bg-white/[0.02] border border-white/5 rounded-xl">
                <Image
                  alt="Vapi"
                  className="rounded-lg object-contain"
                  height={40}
                  width={40}
                  src="/vapi.jpg"
                />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg font-bold text-white tracking-tight">Vapi Integration</CardTitle>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Connected
                  </span>
                </div>
                <CardDescription className="text-zinc-400 text-xs">
                  Manage your active phone lines and custom LLM voices
                </CardDescription>
              </div>
            </div>

            <Button
              onClick={onDisconnect}
              size="sm"
              className="bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 border border-rose-500/20 h-9 px-4 rounded-xl text-xs font-semibold transition-all active:scale-[0.98] gap-1.5"
            >
              <UnplugIcon className="size-3.5" />
              Disconnect
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Widget Configuration Shortcut */}
      <Card className="border border-white/5 bg-zinc-950/40 backdrop-blur-xl shadow-2xl rounded-2xl overflow-hidden">
        <CardHeader className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex size-12 items-center justify-center rounded-xl bg-white/[0.02] border border-white/5 text-zinc-300">
                <SettingsIcon className="size-5" />
              </div>
              <div className="space-y-0.5">
                <CardTitle className="text-base font-bold text-white tracking-tight">Widget Configuration</CardTitle>
                <CardDescription className="text-zinc-400 text-xs">
                  Enable voice agents inside the live customer chatbox widget
                </CardDescription>
              </div>
            </div>
            <Button 
              asChild 
              className="bg-white hover:bg-zinc-200 text-black border border-white/10 h-9 px-4 rounded-xl text-xs font-semibold transition-all active:scale-[0.98] gap-1.5"
            >
              <Link href="/customization">
                <SettingsIcon className="size-3.5" />
                Configure Widget
              </Link>
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs Layout */}
      <div className="overflow-hidden rounded-2xl border border-white/5 bg-zinc-950/20 backdrop-blur-xl shadow-2xl p-1">
        <Tabs
          className="gap-0"
          defaultValue="phone-numbers"
          onValueChange={setActiveTab}
          value={activeTab}
        >
          <TabsList className="grid h-12 w-full grid-cols-2 p-1.5 bg-zinc-900/40 border border-white/5 rounded-xl">
            <TabsTrigger 
              className="h-full rounded-lg text-xs font-semibold uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-black text-zinc-400 transition-all cursor-pointer gap-1.5" 
              value="phone-numbers"
            >
              <PhoneIcon className="size-3.5" />
              Phone Numbers
            </TabsTrigger>
            <TabsTrigger 
              className="h-full rounded-lg text-xs font-semibold uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-black text-zinc-400 transition-all cursor-pointer gap-1.5" 
              value="assistants"
            >
              <BotIcon className="size-3.5" />
              AI Assistants
            </TabsTrigger>
          </TabsList>
          <div className="p-4">
            <TabsContent value="phone-numbers" className="mt-0 outline-none">
              <VapiPhoneNumbersTab />
            </TabsContent>
            <TabsContent value="assistants" className="mt-0 outline-none">
              <VapiAssistantsTab />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

