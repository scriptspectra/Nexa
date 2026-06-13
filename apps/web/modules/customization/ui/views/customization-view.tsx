"use client";

import { CustomizationForm } from "../components/customization-form";
import { api } from "@workspace/backend/_generated/api";
import { useQuery } from "convex/react";

export const CustomizationView = () => {
  const widgetSettings = useQuery(api.private.widgetSettings.getOne);
  const vapiPlugin = useQuery(api.private.plugins.getOne, {
    service: "vapi",
  });

  if (widgetSettings === undefined || vapiPlugin === undefined) {
    return (
      <div className="flex-1 flex items-center justify-center p-xl">
        <p className="text-on-surface-variant text-label-md font-label-md">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-xl custom-scrollbar">
      <div className="max-w-5xl mx-auto">
        <div className="mb-xl flex justify-between items-end">
          <div>
            <h2 className="text-headline-lg font-headline-lg text-primary">Widget Configuration</h2>
            <p className="text-body-md font-body-md text-on-surface-variant mt-xs">
              Fine-tune your customer-facing interface and AI voice behavior.
            </p>
          </div>
          <button form="customization-form" type="submit" className="bg-primary text-on-primary px-lg py-xs text-label-md font-label-md font-bold hover:opacity-90 active:scale-[0.98] transition-all">
            Save Settings
          </button>
        </div>

        <CustomizationForm
          initialData={widgetSettings}
          hasVapiPlugin={!!vapiPlugin}
        />
      </div>
    </div>
  );
};
