"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Doc } from "@workspace/backend/_generated/dataModel";
import { useMutation } from "convex/react";
import { api } from "@workspace/backend/_generated/api";
import { FormSchema } from "../../types";
import { widgetSettingsSchema } from "../../schemas";
import { WidgetPreview } from "./widget-preview";
import { Form } from "@workspace/ui/components/form";
import { VapiFormFields } from "./vapi-form-fields";

type WidgetSettings = Doc<"widgetSettings">;

interface CustomizationFormProps {
  initialData?: WidgetSettings | null;
  hasVapiPlugin: boolean;
};

export const CustomizationForm = ({
  initialData,
  hasVapiPlugin,
}: CustomizationFormProps) => {
  const upsertWidgetSettings = useMutation(api.private.widgetSettings.upsert);

  const form = useForm<FormSchema>({
    resolver: zodResolver(widgetSettingsSchema),
    defaultValues: {
      greetMessage: initialData?.greetMessage || "Hi! How can I help you today?",
      primaryColor: initialData?.primaryColor || "",
      gradientEndColor: initialData?.gradientEndColor || "",
      backgroundColor: initialData?.backgroundColor || "",
      defaultSuggestions: {
        suggestion1: initialData?.defaultSuggestions.suggestion1 || "",
        suggestion2: initialData?.defaultSuggestions.suggestion2 || "",
        suggestion3: initialData?.defaultSuggestions.suggestion3 || "",
      },
      vapiSettings: {
        assistantId: initialData?.vapiSettings.assistantId || "",
        phoneNumber: initialData?.vapiSettings.phoneNumber || "",
      },
    },
  });

  const onSubmit = async (values: FormSchema) => {
    try {
      const vapiSettings: WidgetSettings["vapiSettings"] = {
        assistantId:
          values.vapiSettings.assistantId === "none"
            ? ""
            : values.vapiSettings.assistantId,
        phoneNumber:
          values.vapiSettings.phoneNumber === "none"
            ? ""
            : values.vapiSettings.phoneNumber,
      };

      await upsertWidgetSettings({
        greetMessage: values.greetMessage,
        primaryColor: values.primaryColor,
        gradientEndColor: values.gradientEndColor,
        backgroundColor: values.backgroundColor,
        defaultSuggestions: values.defaultSuggestions,
        vapiSettings,
      });

      toast.success("Widget settings saved");
    } catch(error) {
      console.error(error);
      toast.error("Something went wrong");
    }
  } 

  return (
    <Form {...form}>
      <form id="customization-form" className="grid grid-cols-12 gap-gutter" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="col-span-12 lg:col-span-8 space-y-gutter">
          {/* Section: Greeting Message */}
          <section className="bg-surface-container-low border border-outline-variant p-md rounded-lg">
            <label className="block text-label-md font-label-md text-primary mb-sm">Greeting Message</label>
            <textarea 
              className="w-full bg-black border border-outline-variant p-sm text-body-md font-label-md min-h-[120px] rounded focus:border-primary transition-colors focus:outline-none" 
              placeholder="Type your automated greeting here..."
              {...form.register("greetMessage")}
            ></textarea>
            <p className="text-label-sm font-label-sm text-on-surface-variant mt-xs">This message appears when the widget first expands.</p>
          </section>

          {/* Color Settings (Mapped to user style) */}
          <section className="bg-surface-container-low border border-outline-variant p-md rounded-lg">
            <div className="flex items-center gap-xs mb-md">
              <span className="material-symbols-outlined text-primary">palette</span>
              <h3 className="text-label-md font-label-md text-primary uppercase tracking-wider">Color Customization</h3>
            </div>
            <div className="space-y-sm">
              <div>
                <label className="block text-label-sm font-label-sm text-on-surface-variant mb-base">Primary Color</label>
                <div className="flex items-center gap-x-3">
                  <input
                    type="color"
                    className="w-12 h-12 p-1 cursor-pointer bg-black border border-outline-variant rounded"
                    value={form.watch("primaryColor") || "#3b82f6"}
                    onChange={(e) => form.setValue("primaryColor", e.target.value, { shouldValidate: true, shouldDirty: true })}
                  />
                  <input
                    type="text"
                    className="w-full bg-black border border-outline-variant p-sm text-body-sm font-label-md rounded focus:border-primary transition-colors focus:outline-none"
                    placeholder="#3b82f6"
                    {...form.register("primaryColor")}
                  />
                </div>
              </div>
              <div>
                <label className="block text-label-sm font-label-sm text-on-surface-variant mb-base">Gradient End Color</label>
                <div className="flex items-center gap-x-3">
                  <input
                    type="color"
                    className="w-12 h-12 p-1 cursor-pointer bg-black border border-outline-variant rounded"
                    value={form.watch("gradientEndColor") || "#0b63f3"}
                    onChange={(e) => form.setValue("gradientEndColor", e.target.value, { shouldValidate: true, shouldDirty: true })}
                  />
                  <input
                    type="text"
                    className="w-full bg-black border border-outline-variant p-sm text-body-sm font-label-md rounded focus:border-primary transition-colors focus:outline-none"
                    placeholder="#0b63f3"
                    {...form.register("gradientEndColor")}
                  />
                </div>
              </div>
              <div>
                <label className="block text-label-sm font-label-sm text-on-surface-variant mb-base">Background Color</label>
                <div className="flex items-center gap-x-3">
                  <input
                    type="color"
                    className="w-12 h-12 p-1 cursor-pointer bg-black border border-outline-variant rounded"
                    value={form.watch("backgroundColor") || "#ffffff"}
                    onChange={(e) => form.setValue("backgroundColor", e.target.value, { shouldValidate: true, shouldDirty: true })}
                  />
                  <input
                    type="text"
                    className="w-full bg-black border border-outline-variant p-sm text-body-sm font-label-md rounded focus:border-primary transition-colors focus:outline-none"
                    placeholder="#ffffff"
                    {...form.register("backgroundColor")}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Section: Default Suggestions */}
          <section className="bg-surface-container-low border border-outline-variant p-md rounded-lg">
            <div className="flex items-center gap-xs mb-md">
              <span className="material-symbols-outlined text-primary">bolt</span>
              <h3 className="text-label-md font-label-md text-primary uppercase tracking-wider">Quick Suggestions</h3>
            </div>
            <div className="space-y-sm">
              <div>
                <label className="block text-label-sm font-label-sm text-on-surface-variant mb-base">Suggestion 1</label>
                <input 
                  className="w-full bg-black border border-outline-variant p-sm text-body-sm font-label-md rounded focus:border-primary transition-colors focus:outline-none" 
                  type="text" 
                  {...form.register("defaultSuggestions.suggestion1")}
                />
              </div>
              <div>
                <label className="block text-label-sm font-label-sm text-on-surface-variant mb-base">Suggestion 2</label>
                <input 
                  className="w-full bg-black border border-outline-variant p-sm text-body-sm font-label-md rounded focus:border-primary transition-colors focus:outline-none" 
                  type="text" 
                  {...form.register("defaultSuggestions.suggestion2")}
                />
              </div>
              <div>
                <label className="block text-label-sm font-label-sm text-on-surface-variant mb-base">Suggestion 3</label>
                <input 
                  className="w-full bg-black border border-outline-variant p-sm text-body-sm font-label-md rounded focus:border-primary transition-colors focus:outline-none" 
                  type="text" 
                  {...form.register("defaultSuggestions.suggestion3")}
                />
              </div>
            </div>
          </section>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-gutter">
          {hasVapiPlugin && (
            <section className="bg-surface-container-low border border-outline-variant p-md rounded-lg">
              <div className="flex items-center gap-xs mb-md">
                <span className="material-symbols-outlined text-primary">settings_voice</span>
                <h3 className="text-label-md font-label-md text-primary uppercase tracking-wider">Voice Assistant</h3>
              </div>
              <div className="space-y-md">
                <VapiFormFields form={form} />
                
                <div className="pt-sm border-t border-outline-variant mt-md">
                  <div className="flex items-center justify-between py-xs">
                    <span className="text-body-sm font-body-sm text-on-surface">Enable Transcriptions</span>
                    <div className="w-10 h-5 bg-primary rounded-full relative cursor-pointer">
                      <div className="absolute right-1 top-1 w-3 h-3 bg-on-primary rounded-full"></div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-xs">
                    <span className="text-body-sm font-body-sm text-on-surface">Noise Cancellation</span>
                    <div className="w-10 h-5 bg-surface-container-highest border border-outline-variant rounded-full relative cursor-pointer">
                      <div className="absolute left-1 top-1 w-3 h-3 bg-on-surface-variant rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          <section className="bg-surface-container-lowest border border-outline-variant overflow-hidden rounded-lg group relative h-[320px] flex items-center justify-center p-4">
            <WidgetPreview values={form.watch()} hasVapiPlugin={hasVapiPlugin} />
          </section>
        </div>
      </form>
    </Form>
  );
};
