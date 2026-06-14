"use client";

import {
  GlobeIcon,
  PhoneCallIcon,
  PhoneIcon,
  WorkflowIcon,
} from "lucide-react";
import { type Feature, PluginCard } from "../components/plugin-card";
import { useMutation, useQuery } from "convex/react";
import { api } from "@workspace/backend/_generated/api";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@workspace/ui/components/button";
import { VapiConnectedView } from "../components/vapi-connected-view";

const vapiFeatures: Feature[] = [
  {
    icon: GlobeIcon,
    label: "Web voice calls",
    description: "Voice chat directly in your app",
  },
  {
    icon: PhoneIcon,
    label: "Phone numbers",
    description: "Get dedicated business lines",
  },
  {
    icon: PhoneCallIcon,
    label: "Outbound calls",
    description: "Automated customer outreach",
  },
  {
    icon: WorkflowIcon,
    label: "Workflows",
    description: "Custom conversation flows",
  },
];

const formSchema = z.object({
  publicApiKey: z.string().min(1, { message: "Public API key is required" }),
  privateApiKey: z.string().min(1, { message: "Private API key is required" }),
});

const VapiPluginForm = ({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (value: boolean) => void;
}) => {
  const upsertSecret = useMutation(api.private.secrets.upsert);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      publicApiKey: "",
      privateApiKey: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      console.log("Submitting Vapi secrets...");
      const result = await upsertSecret({
        service: "vapi",
        value: {
          publicApiKey: values.publicApiKey,
          privateApiKey: values.privateApiKey,
        },
      });
      console.log("Vapi secrets submitted successfully, result:", result);
      setOpen(false);
      toast.success("Vapi secret created");
      // Force reload after toast shows
      setTimeout(() => {
        console.log("Reloading page...");
        window.location.href = window.location.href;
      }, 1500);
    } catch (error) {
      console.error("Error submitting Vapi secrets:", error);
      toast.error("Something went wrong");
    }
  };

  return (
    <>
      {open && createPortal(
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#09090b',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '512px',
            width: '100%',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            position: 'relative'
          }}>
            <button
              onClick={() => setOpen(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                color: 'rgba(255, 255, 255, 0.5)',
                fontSize: '24px',
                fontWeight: 'bold',
                cursor: 'pointer',
                background: 'none',
                border: 'none',
                zIndex: 10
              }}
              onMouseOver={(e) => e.currentTarget.style.color = 'white'}
              onMouseOut={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)'}
            >
              ✕
            </button>
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ color: 'white', fontSize: '24px', fontWeight: 'bold', marginBottom: '12px' }}>
                Enable Vapi
              </h2>
              <p style={{ color: '#a1a1aa', fontSize: '14px', lineHeight: '1.5' }}>
                Your API keys are safely encrypted and stored using AWS Secrets Manager.
              </p>
            </div>
            <Form {...form}>
              <form
                style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
                onSubmit={form.handleSubmit(onSubmit)}
              >
                <FormField
                  control={form.control}
                  name="publicApiKey"
                  render={({ field }) => (
                    <FormItem>
                      <Label style={{ color: 'white', fontSize: '14px', fontWeight: 500, display: 'block', marginBottom: '8px' }}>
                        Public API key
                      </Label>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Your public API key"
                          type="password"
                          style={{
                            backgroundColor: '#18181b',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: 'white',
                            height: '44px',
                            width: '100%',
                            borderRadius: '8px',
                            padding: '0 12px'
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="privateApiKey"
                  render={({ field }) => (
                    <FormItem>
                      <Label style={{ color: 'white', fontSize: '14px', fontWeight: 500, display: 'block', marginBottom: '8px' }}>
                        Private API key
                      </Label>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Your private API key"
                          type="password"
                          style={{
                            backgroundColor: '#18181b',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: 'white',
                            height: '44px',
                            width: '100%',
                            borderRadius: '8px',
                            padding: '0 12px'
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                    style={{
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: 'white',
                      height: '40px',
                      padding: '0 16px'
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    disabled={form.formState.isSubmitting}
                    type="submit"
                    style={{
                      backgroundColor: 'white',
                      color: 'black',
                      height: '40px',
                      padding: '0 16px'
                    }}
                  >
                    {form.formState.isSubmitting ? "Connecting..." : "Connect"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>,
        document.body
      )}
    </>
  )
};

const VapiPluginRemoveForm = ({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (value: boolean) => void;
}) => {
  const removePlugin = useMutation(api.private.plugins.remove);

  const onSubmit = async () => {
    try {
      await removePlugin({
        service: "vapi",
      });
      setOpen(false);
      toast.success("Vapi plugin removed");
    } catch (error) {
      console.error(error);
      toast.error("Failed to disconnect");
    }
  };

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-zinc-950 border border-white/10 rounded-xl p-6 max-w-md w-full shadow-2xl relative">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
            >
              ✕
            </button>
            <h2 className="text-xl font-semibold text-white mb-2">Disconnect Vapi</h2>
            <p className="text-sm text-zinc-400 mb-6">
              Are you sure you want to disconnect the Vapi plugin?
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="border-white/10 text-white hover:bg-white/5"
              >
                Cancel
              </Button>
              <Button
                onClick={onSubmit}
                variant="destructive"
                className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20"
              >
                Disconnect
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export const VapiView = () => {
  const vapiPlugin = useQuery(api.private.plugins.getOne, { service: "vapi" });
  console.log("VapiPlugin query result:", vapiPlugin);

  const [connectOpen, setConnectOpen] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);

  const toggleConnection = () => {
    if (vapiPlugin) {
      setRemoveOpen(true);
    } else {
      setConnectOpen(true);
    }
  };

  return (
    <>
      <VapiPluginForm open={connectOpen} setOpen={setConnectOpen} />
      <VapiPluginRemoveForm open={removeOpen} setOpen={setRemoveOpen} />
      <div className="flex min-h-screen flex-col bg-black p-6 md:p-12 overflow-y-auto">
        <div className="mx-auto w-full max-w-2xl space-y-8">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-primary/10 text-primary border border-primary/20">
              <WorkflowIcon className="size-3 text-primary animate-pulse" />
              Voice Integrations
            </div>

            <div className="space-y-1">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
                Vapi Plugin
              </h1>

              <p className="text-base text-zinc-400 max-w-3xl leading-relaxed">
                Connect Vapi to enable real-time AI voice agents, purchase dedicated phone numbers, and configure automated outbound phone calls.
              </p>
            </div>
          </div>

          <div className="mt-8">
            {vapiPlugin ? (
              <VapiConnectedView onDisconnect={toggleConnection} />
            ) : (
              <PluginCard
                serviceImage="/vapi.jpg"
                serviceName="Vapi"
                features={vapiFeatures}
                isDisabled={vapiPlugin === undefined}
                onSubmit={toggleConnection}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
};
