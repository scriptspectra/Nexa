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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
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
  console.log("VapiPluginForm rendered, open prop:", open);

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
      await upsertSecret({
        service: "vapi",
        value: {
          publicApiKey: values.publicApiKey,
          privateApiKey: values.privateApiKey,
        },
      });
      setOpen(false);
      toast.success("Vapi secret created");
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong");
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enable Vapi</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          Your API keys are safely encrypted and stored using AWS Secrets
          Manager.
        </DialogDescription>
        <Form {...form}>
          <form
            className="flex flex-col gap-y-4"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <FormField
              control={form.control}
              name="publicApiKey"
              render={({ field }) => (
                <FormItem>
                  <Label>Public API key</Label>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Your public API key"
                      type="password"
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
                  <Label>Private API key</Label>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Your private API key"
                      type="password"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                disabled={form.formState.isSubmitting}
                type="submit"
              >
                {form.formState.isSubmitting ? "Connecting..." : "Connect"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
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
      console.log("Removing Vapi plugin...");
      await removePlugin({
        service: "vapi",
      });
      setOpen(false);
      toast.success("Vapi plugin removed");
      console.log("Vapi plugin removed successfully");
    } catch (error) {
      console.error("Error removing Vapi plugin:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Failed to disconnect: ${errorMessage}`);
    }
  };

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Disconnect Vapi</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          Are you sure you want to disconnect the Vapi plugin?
        </DialogDescription>
        <DialogFooter>
          <Button onClick={onSubmit} variant="destructive">
            Disconnect
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const VapiView = () => {
  const vapiPlugin = useQuery(api.private.plugins.getOne, { service: "vapi" });

  const [connectOpen, setConnectOpen] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);

  const toggleConnection = () => {
    console.log("toggleConnection called, vapiPlugin:", vapiPlugin);
    if (vapiPlugin) {
      console.log("Opening remove dialog");
      setRemoveOpen(true);
    } else {
      console.log("Opening connect dialog");
      setConnectOpen(true);
    }
  };

  useEffect(() => {
    console.log("connectOpen state changed:", connectOpen);
  }, [connectOpen]);

  useEffect(() => {
    console.log("removeOpen state changed:", removeOpen);
  }, [removeOpen]);

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
                isDisabled={false}
                onSubmit={toggleConnection}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
};
