"use client";

import {
  type LucideIcon,
  BookOpenIcon,
  BotIcon,
  GemIcon,
  MicIcon,
  PaletteIcon,
  PhoneIcon,
  UsersIcon,
  PlugIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";

interface Feature {
  icon: LucideIcon;
  label: string;
  description: string;
};

interface PremiumFeatureOverlayProps {
  children: React.ReactNode;
};

const features: Feature[] = [
  {
    icon: BotIcon,
    label: "AI Customer Support",
    description: "Intelligent automated responses 24/7",
  },
  {
    icon: MicIcon,
    label: "AI Voice Agent",
    description: "Natural voice conversations with customers",
  },
  {
    icon: PhoneIcon,
    label: "Phone System",
    description: "Inbound & outbound calling capabilities",
  },
  {
    icon: BookOpenIcon,
    label: "Knowledge Base",
    description: "Train AI on your documentation",
  },
  {
    icon: UsersIcon,
    label: "Team Access",
    description: "Up to 5 operators per organization",
  },
  {
    icon: PaletteIcon,
    label: "Widget Customization",
    description: "Customize your chat widget appearance",
  },
  {
    icon: PlugIcon,
    label: "Integrations",
    description: "Embed chat & voice widgets into any platform",
  },
];

export const PremiumFeatureOverlay = ({
  children
}: PremiumFeatureOverlayProps) => {
  const router = useRouter();

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      {/* Blurred background content */}
      <div className="pointer-events-none select-none blur-sm opacity-40 w-full h-full">
        {children}
      </div>

      {/* Overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 50,
          background: "rgba(0,0,0,0.88)",
          backdropFilter: "blur(6px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem",
        }}
      >
        {/* Glow aura behind card (neutral now) */}
        <div
          style={{
            position: "absolute",
            inset: "auto",
            width: "600px",
            height: "600px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        {/* Upgrade card */}
        <div
          style={{
            position: "relative",
            width: "100%",
            maxWidth: "560px",
            zIndex: 1,
          }}
        >
          <Card
            style={{
              background: "rgba(9,9,11,0.92)",
              border: "1px solid rgba(255,255,255,0.10)",
              borderRadius: "1rem",
              boxShadow: "0 25px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)",
              overflow: "hidden",
            }}
          >
            {/* Top highlight line (white only) */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "2px",
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)",
              }}
            />

            <CardHeader className="text-center pb-4 pt-8">
              <div className="flex justify-center mb-4">
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "4px 12px",
                    borderRadius: "9999px",
                    fontSize: "10px",
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    background: "rgba(255,255,255,0.06)",
                    color: "rgb(255,255,255)",
                    border: "1px solid rgba(255,255,255,0.15)",
                  }}
                >
                  <GemIcon style={{ width: "12px", height: "12px" }} />
                  Pro Feature
                </span>
              </div>

              <CardTitle
                style={{
                  fontSize: "22px",
                  fontWeight: 700,
                  color: "white",
                  letterSpacing: "-0.02em",
                }}
              >
                Unlock Premium Capabilities
              </CardTitle>

              <CardDescription
                style={{
                  color: "rgb(180,180,180)",
                  fontSize: "13px",
                  marginTop: "6px",
                  maxWidth: "380px",
                  margin: "8px auto 0",
                  lineHeight: "1.5",
                }}
              >
                Upgrade to access advanced integrations, custom AI training, and voice channels.
              </CardDescription>
            </CardHeader>

            <CardContent className="pb-6 px-6">
              {/* Features Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10px",
                  marginBottom: "20px",
                }}
              >
                {features.map((feature, index) => (
                  <div
                    key={feature.label}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "10px",
                      padding: "10px",
                      borderRadius: "10px",
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      gridColumn: index === 6 ? "span 2" : "span 1",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        width: "32px",
                        height: "32px",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "8px",
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        color: "white",
                        flexShrink: 0,
                      }}
                    >
                      <feature.icon style={{ width: "15px", height: "15px" }} />
                    </div>

                    <div style={{ textAlign: "left" }}>
                      <p style={{ fontWeight: 600, fontSize: "13px", color: "rgb(235,235,235)" }}>
                        {feature.label}
                      </p>
                      <p style={{ color: "rgb(160,160,160)", fontSize: "11px", marginTop: "2px", lineHeight: "1.4" }}>
                        {feature.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                onClick={() => router.push("/billing")}
                size="lg"
                style={{
                  width: "100%",
                  background: "white",
                  color: "black",
                  fontWeight: 700,
                  borderRadius: "10px",
                  height: "44px",
                  fontSize: "14px",
                  letterSpacing: "0.01em",
                  border: "none",
                  cursor: "pointer",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
                }}
              >
                View Pricing Plans
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};