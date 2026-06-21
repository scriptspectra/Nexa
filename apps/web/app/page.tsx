"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { motion, useInView, type Variants, easeOut } from "framer-motion";
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: easeOut },
  }),
};

import { SignedIn, SignedOut } from "@clerk/nextjs";
import {
  MessageSquare,
  BarChart3,
  FileText,
  Globe,
  Smartphone,
  CreditCard,
  Bell,
  Shield,
  Plug,
  Palette,
  Key,
  Activity,
  Zap,
  ChevronRight,
  Check,
  ArrowRight,
  Twitter,
  Github,
  Linkedin,
  Menu,
  X,
  Star,
  TrendingUp,
  Users,
  Clock,
} from "lucide-react";



const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

function useSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return { ref, inView };
}

const FEATURES = [
  {
    icon: MessageSquare,
    title: "Unified Conversational Dashboard",
    desc: "Real-time metrics on AI-driven conversations — total chats, response latency, sentiment trends — all in one view.",
  },
  {
    icon: BarChart3,
    title: "AI-Generated Insights & Heatmaps",
    desc: "Visual heatmaps of user activity, automatic detection of peak usage windows, and AI-summarized recommendations.",
  },
  {
    icon: FileText,
    title: "One-Click PDF Export",
    desc: "Generate a ready-to-share analytics report in seconds. Perfect for quarterly business reviews or client deliverables.",
  },
  {
    icon: Globe,
    title: "Multilingual & Voice Support",
    desc: "Ingest and respond in multiple languages, with an optional Vapi voice-agent for phone-based interactions.",
  },
  {
    icon: Smartphone,
    title: "PWA — Install Anywhere",
    desc: "Users can add Zephyra to their home screen and work offline. Drives higher retention and reduces churn.",
  },
  {
    icon: CreditCard,
    title: "Scalable SaaS Billing",
    desc: "Tiered pricing with automatic invoice generation, Lemon Squeezy checkout, and seamless seat-based scaling.",
  },
  {
    icon: Bell,
    title: "Usage-Based Quotas & Alerts",
    desc: "Real-time usage stats with visual progress bars. Admins receive alerts when limits approach, preventing overages.",
  },
  {
    icon: Shield,
    title: "Secure Organizational Guardrails",
    desc: "AuthGuard + OrganizationGuard enforce per-org isolation, ensuring data privacy and SOC 2-ready compliance.",
  },
  {
    icon: Plug,
    title: "Shopify & 3rd-Party Integrations",
    desc: "Plug-and-play Shopify sync with a plugin framework for future CRM and marketing tool extensions.",
  },
  {
    icon: Palette,
    title: "Customizable Branding & Theme",
    desc: "Adjust colors, fonts, and logo via the Customization module for full white-label deployments.",
  },
  {
    icon: Key,
    title: "Audit Log & API-Key Management",
    desc: "Fine-grained API keys with scope controls, plus a full audit trail for compliance and security audits.",
  },
  {
    icon: Activity,
    title: "SLA & Incident Dashboard",
    desc: "Real-time SLA status, incident history, and automated escalation hooks keep service commitments transparent.",
  },
];

const STEPS = [
  {
    num: "01",
    title: "Connect Your Channels",
    desc: "Integrate Zephyra with your existing platforms in minutes using our plug-and-play connector library.",
  },
  {
    num: "02",
    title: "Configure Your AI",
    desc: "Tune conversation flows, set guardrails, and personalise your brand's voice — no engineering required.",
  },
  {
    num: "03",
    title: "Launch & Monitor",
    desc: "Go live instantly and watch the unified dashboard surface insights, anomalies, and growth opportunities.",
  },
  {
    num: "04",
    title: "Scale on Demand",
    desc: "Upgrade seats and unlock advanced features as usage grows — the serverless backend scales automatically.",
  },
];

const PLANS = [
  {
    name: "Starter",
    price: "$0",
    period: "/ month",
    highlight: false,
    features: [
      "Up to 500 AI conversations",
      "1 workspace",
      "Basic analytics dashboard",
      "Community support",
      "PWA access",
    ],
    cta: "Get Started Free",
    href: "/sign-up",
  },
  {
    name: "Professional",
    price: "$19",
    period: "/ month",
    highlight: true,
    features: [
      "Unlimited conversations",
      "10 workspaces",
      "AI heatmaps & insights",
      "PDF export & reporting",
      "Multilingual + Voice support",
      "Shopify & CRM integrations",
      "Priority support",
      "Audit log & API keys",
    ],
    cta: "Start Free Trial",
    href: "/sign-up",
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    highlight: false,
    features: [
      "Everything in Professional",
      "Unlimited seats",
      "White-label branding",
      "SLA dashboard",
      "SSO & SAML",
      "Dedicated success manager",
    ],
    cta: "Contact Sales",
    href: "/sign-up",
  },
];

const STATS = [
  { icon: Users, value: "12K+", label: "Businesses Served" },
  { icon: MessageSquare, value: "4.8M", label: "Conversations / Month" },
  { icon: Globe, value: "40+", label: "Languages Supported" },
  { icon: TrendingUp, value: "99.9%", label: "Uptime SLA" },
];

function DashboardMockup() {
  return (
    <div className="relative w-full max-w-xl mx-auto">
      <div
        className="rounded-2xl border border-violet-500/20 bg-[#0d0d1a]/90 shadow-2xl shadow-violet-900/30 p-5 backdrop-blur-sm"
        style={{ fontFamily: "system-ui" }}
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-3 h-3 rounded-full bg-red-500/70" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
          <div className="w-3 h-3 rounded-full bg-green-500/70" />
          <span className="ml-2 text-xs text-violet-300/60">
            Zephyra Dashboard
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: "Total Chats", val: "48.2K", delta: "+24%" },
            { label: "Avg Latency", val: "1.2s", delta: "-18%" },
            { label: "Sentiment", val: "94%", delta: "+7%" },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-lg bg-violet-600/10 border border-violet-500/20 p-3"
            >
              <div className="text-[10px] text-violet-300/60 mb-1">
                {s.label}
              </div>
              <div className="text-lg font-bold text-white">{s.val}</div>
              <div className="text-[10px] text-emerald-400">{s.delta}</div>
            </div>
          ))}
        </div>

        <div className="rounded-lg bg-violet-600/5 border border-violet-500/15 p-3 mb-3">
          <div className="text-[10px] text-violet-300/50 mb-2">
            Conversation Volume
          </div>
          <div className="flex items-end gap-1 h-16">
            {[40, 65, 45, 80, 60, 90, 75, 100, 85, 95, 70, 88].map(
              (h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t"
                  style={{
                    height: `${h}%`,
                    background: `linear-gradient(to top, #7c3aed, #a78bfa)`,
                    opacity: 0.5 + (i / 12) * 0.5,
                  }}
                />
              )
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-violet-600/5 border border-violet-500/15 p-3">
            <div className="text-[10px] text-violet-300/50 mb-1">
              Usage Quota
            </div>
            <div className="w-full bg-violet-900/40 rounded-full h-2 mb-1">
              <div
                className="bg-gradient-to-r from-violet-500 to-cyan-400 h-2 rounded-full"
                style={{ width: "68%" }}
              />
            </div>
            <div className="text-[10px] text-violet-300/70">
              3,400 / 5,000 runs
            </div>
          </div>
          <div className="rounded-lg bg-violet-600/5 border border-violet-500/15 p-3">
            <div className="text-[10px] text-violet-300/50 mb-1">
              Languages Active
            </div>
            <div className="flex gap-1 flex-wrap mt-1">
              {["EN", "ES", "FR", "DE", "JP"].map((l) => (
                <span
                  key={l}
                  className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                >
                  {l}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="absolute -top-6 -right-6 w-36 h-24 rounded-xl border border-cyan-500/25 bg-[#0d0d1a]/90 shadow-lg shadow-cyan-900/20 p-3 backdrop-blur-sm">
        <div className="text-[9px] text-cyan-300/60 mb-1">AI Sentiment</div>
        <div className="text-2xl font-bold text-white">82%</div>
        <div className="text-[9px] text-emerald-400">Positive</div>
        <div className="w-full bg-cyan-900/30 rounded-full h-1.5 mt-2">
          <div
            className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-1.5 rounded-full"
            style={{ width: "82%" }}
          />
        </div>
      </div>

      <div className="absolute -bottom-4 -left-6 w-32 h-20 rounded-xl border border-violet-500/25 bg-[#0d0d1a]/90 shadow-lg shadow-violet-900/20 p-3 backdrop-blur-sm">
        <div className="text-[9px] text-violet-300/60 mb-1">SLA Status</div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold text-white">Operational</span>
        </div>
        <div className="text-[9px] text-emerald-400 mt-1">99.9% uptime</div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const heroSection = useSection();
  const statsSection = useSection();
  const featuresSection = useSection();
  const howSection = useSection();
  const pricingSection = useSection();
  const ctaSection = useSection();

  return (
    <div
      className="min-h-screen text-white overflow-x-hidden"
      style={{ background: "#06060f" }}
    >
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(124,58,237,0.25) 0%, transparent 70%)",
        }}
      />

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#06060f]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-400 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">Zephyra</span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm text-white/60">
            {["Features", "How It Works", "Pricing", "About"].map((n) => (
              <a
                key={n}
                href="#"
                className="hover:text-white transition-colors duration-200"
              >
                {n}
              </a>
            ))}
          </div>

          {/* Auth — FUNCTIONALITY PRESERVED */}
          <div className="hidden md:flex items-center gap-3">
            <SignedOut>
              <Link
                href="/sign-in"
                className="text-sm text-white/60 hover:text-white transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className="text-sm px-4 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 transition-all duration-200 font-medium shadow-lg shadow-violet-900/30"
              >
                Start Free
              </Link>
            </SignedOut>
            <SignedIn>
              <Link
                href="/conversations"
                className="text-sm px-4 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 transition-all duration-200 font-medium shadow-lg shadow-violet-900/30"
              >
                Dashboard
              </Link>
            </SignedIn>
          </div>

          <button
            className="md:hidden p-2 text-white/60 hover:text-white"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-white/5 bg-[#06060f]/95 px-6 py-4 flex flex-col gap-4">
            {["Features", "How It Works", "Pricing", "About"].map((n) => (
              <a
                key={n}
                href="#"
                className="text-white/60 hover:text-white text-sm transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                {n}
              </a>
            ))}
            <SignedOut>
              <Link
                href="/sign-up"
                className="text-sm px-4 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-violet-500 text-center font-medium"
                onClick={() => setMobileOpen(false)}
              >
                Start Free
              </Link>
            </SignedOut>
            <SignedIn>
              <Link
                href="/conversations"
                className="text-sm px-4 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-violet-500 text-center font-medium"
                onClick={() => setMobileOpen(false)}
              >
                Dashboard
              </Link>
            </SignedIn>
          </div>
        )}
      </nav>

      {/* HERO */}
      <section
        ref={heroSection.ref}
        className="relative pt-32 pb-24 px-6 overflow-hidden"
      >
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)",
          }}
        />

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            variants={stagger}
            initial="hidden"
            animate={heroSection.inView ? "visible" : "hidden"}
          >
            <motion.div
              variants={fadeUp}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-xs font-medium mb-6"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
              AI-Powered Conversational Platform
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="text-5xl lg:text-6xl font-extrabold leading-tight mb-6 tracking-tight"
            >
              Conversations that{" "}
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, #a78bfa 0%, #38bdf8 100%)",
                }}
              >
                drive serious growth
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="text-lg text-white/50 leading-relaxed mb-8 max-w-lg"
            >
              From unified AI dashboards to multilingual voice support —
              everything your business needs to engage customers, measure ROI,
              and scale without limits.
            </motion.p>

            <motion.div
              variants={fadeUp}
              className="flex flex-wrap items-center gap-4"
            >
              <Link
                href="/sign-up"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 font-semibold transition-all duration-200 shadow-xl shadow-violet-900/40 hover:shadow-violet-700/40 hover:scale-105"
              >
                Start for Free
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 font-medium transition-all duration-200"
              >
                View Demo
                <ChevronRight className="w-4 h-4" />
              </a>
            </motion.div>

            <motion.div
              variants={fadeUp}
              className="flex items-center gap-3 mt-8"
            >
              <div className="flex -space-x-2">
                {["#7c3aed", "#06b6d4", "#f43f5e", "#10b981"].map((c, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full border-2 border-[#06060f] flex items-center justify-center text-xs font-bold"
                    style={{ background: c }}
                  >
                    {["A", "B", "C", "D"][i]}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>
              <span className="text-sm text-white/40">
                Trusted by 12K+ businesses
              </span>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={
              heroSection.inView
                ? { opacity: 1, scale: 1, y: 0 }
                : { opacity: 0, scale: 0.92, y: 30 }
            }
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            className="relative"
          >
            <DashboardMockup />
          </motion.div>
        </div>
      </section>

      {/* STATS */}
      <section
        ref={statsSection.ref}
        className="py-16 px-6 border-y border-white/5"
      >
        <div className="max-w-7xl mx-auto">
          <motion.div
            variants={stagger}
            initial="hidden"
            animate={statsSection.inView ? "visible" : "hidden"}
            className="grid grid-cols-2 md:grid-cols-4 gap-6"
          >
            {STATS.map((s, i) => (
              <motion.div
                key={s.label}
                variants={fadeUp}
                custom={i}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 mb-3 mx-auto">
                  <s.icon className="w-5 h-5 text-violet-400" />
                </div>
                <div className="text-3xl font-extrabold text-white mb-1">
                  {s.value}
                </div>
                <div className="text-sm text-white/40">{s.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FEATURES */}
      <section ref={featuresSection.ref} className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            variants={stagger}
            initial="hidden"
            animate={featuresSection.inView ? "visible" : "hidden"}
            className="text-center mb-16"
          >
            <motion.div
              variants={fadeUp}
              className="text-sm text-violet-400 font-semibold uppercase tracking-widest mb-3"
            >
              What We Deliver
            </motion.div>
            <motion.h2
              variants={fadeUp}
              className="text-4xl font-bold text-white mb-4"
            >
              Powerful features that grow your business
            </motion.h2>
            <motion.p
              variants={fadeUp}
              className="text-white/40 max-w-xl mx-auto text-lg"
            >
              15 enterprise-grade capabilities — already built in, ready to
              activate.
            </motion.p>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            animate={featuresSection.inView ? "visible" : "hidden"}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                variants={fadeUp}
                custom={i}
                whileHover={{ y: -4, scale: 1.02 }}
                transition={{ duration: 0.2 }}
                className="group rounded-2xl border border-white/5 bg-white/[0.02] hover:border-violet-500/30 hover:bg-violet-500/5 p-6 transition-all duration-300 cursor-pointer"
              >
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-600/30 to-cyan-500/20 border border-violet-500/20 flex items-center justify-center mb-4 group-hover:from-violet-600/50 group-hover:to-cyan-500/30 transition-all duration-300">
                  <f.icon className="w-5 h-5 text-violet-300" />
                </div>
                <h3 className="text-base font-semibold text-white mb-2">
                  {f.title}
                </h3>
                <p className="text-sm text-white/40 leading-relaxed">
                  {f.desc}
                </p>
                <div className="mt-4 inline-flex items-center gap-1 text-xs text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  Learn more <ChevronRight className="w-3 h-3" />
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section
        ref={howSection.ref}
        className="py-24 px-6"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(124,58,237,0.07) 0%, transparent 70%)",
        }}
      >
        <div className="max-w-7xl mx-auto">
          <motion.div
            variants={stagger}
            initial="hidden"
            animate={howSection.inView ? "visible" : "hidden"}
            className="text-center mb-16"
          >
            <motion.div
              variants={fadeUp}
              className="text-sm text-violet-400 font-semibold uppercase tracking-widest mb-3"
            >
              Our Process
            </motion.div>
            <motion.h2
              variants={fadeUp}
              className="text-4xl font-bold text-white"
            >
              Go from zero to impact in minutes
            </motion.h2>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            animate={howSection.inView ? "visible" : "hidden"}
            className="grid md:grid-cols-4 gap-6 relative"
          >
            <div className="hidden md:block absolute top-10 left-[12%] right-[12%] h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />

            {STEPS.map((s, i) => (
              <motion.div
                key={s.num}
                variants={fadeUp}
                custom={i}
                className="relative text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-violet-800 border border-violet-500/30 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-violet-900/30">
                  <span className="text-xl font-black text-white">{s.num}</span>
                </div>
                <h3 className="text-base font-semibold text-white mb-2">
                  {s.title}
                </h3>
                <p className="text-sm text-white/40 leading-relaxed">
                  {s.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* BUSINESS VALUE */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="rounded-3xl border border-violet-500/15 bg-gradient-to-br from-violet-950/40 to-[#06060f] p-10 grid md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
              <div className="text-sm text-violet-400 font-semibold uppercase tracking-widest mb-3">
                Business Value
              </div>
              <h2 className="text-3xl font-bold text-white leading-tight">
                Why teams choose Zephyra
              </h2>
            </div>
            <div className="md:col-span-2 grid sm:grid-cols-2 gap-4">
              {[
                {
                  icon: TrendingUp,
                  title: "Revenue Growth",
                  desc: "Tiered billing and seamless upgrades turn free users into paying customers.",
                },
                {
                  icon: Users,
                  title: "Customer Retention",
                  desc: "PWA installability and offline support keep users engaged without internet.",
                },
                {
                  icon: Clock,
                  title: "Operational Efficiency",
                  desc: "One-click PDF reports and real-time dashboards cut reporting time by 70%+.",
                },
                {
                  icon: Globe,
                  title: "Market Expansion",
                  desc: "Multilingual & voice capabilities open non-English markets and phone channels.",
                },
              ].map((v) => (
                <div
                  key={v.title}
                  className="flex gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5"
                >
                  <div className="w-10 h-10 rounded-lg bg-violet-500/15 border border-violet-500/20 flex-shrink-0 flex items-center justify-center">
                    <v.icon className="w-4 h-4 text-violet-400" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white mb-1">
                      {v.title}
                    </div>
                    <div className="text-xs text-white/40 leading-relaxed">
                      {v.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section ref={pricingSection.ref} className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            variants={stagger}
            initial="hidden"
            animate={pricingSection.inView ? "visible" : "hidden"}
            className="text-center mb-16"
          >
            <motion.div
              variants={fadeUp}
              className="text-sm text-violet-400 font-semibold uppercase tracking-widest mb-3"
            >
              Pricing
            </motion.div>
            <motion.h2
              variants={fadeUp}
              className="text-4xl font-bold text-white mb-4"
            >
              Start free. Scale with confidence.
            </motion.h2>
            <motion.p variants={fadeUp} className="text-white/40 text-lg">
              No hidden fees. Upgrade or downgrade any time.
            </motion.p>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            animate={pricingSection.inView ? "visible" : "hidden"}
            className="grid md:grid-cols-3 gap-6 items-start"
          >
            {PLANS.map((plan, i) => (
              <motion.div
                key={plan.name}
                variants={fadeUp}
                custom={i}
                className={`rounded-2xl border p-7 relative ${
                  plan.highlight
                    ? "border-violet-500/50 bg-gradient-to-b from-violet-600/15 to-violet-900/10 shadow-2xl shadow-violet-900/30"
                    : "border-white/5 bg-white/[0.02]"
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-violet-500 to-cyan-500 text-xs font-bold text-white">
                    Most Popular
                  </div>
                )}
                <div className="mb-6">
                  <div className="text-sm font-medium text-white/50 mb-1">
                    {plan.name}
                  </div>
                  <div className="flex items-end gap-1">
                    <span className="text-5xl font-extrabold text-white">
                      {plan.price}
                    </span>
                    {plan.period && (
                      <span className="text-white/40 mb-2 text-sm">
                        {plan.period}
                      </span>
                    )}
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <Check className="w-4 h-4 text-violet-400 mt-0.5 flex-shrink-0" />
                      <span className="text-white/70">{f}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.href}
                  className={`w-full block text-center py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
                    plan.highlight
                      ? "bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 text-white shadow-lg shadow-violet-900/30 hover:scale-[1.02]"
                      : "border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-white"
                  }`}
                >
                  {plan.cta}
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section ref={ctaSection.ref} className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            variants={stagger}
            initial="hidden"
            animate={ctaSection.inView ? "visible" : "hidden"}
          >
            <motion.div
              variants={fadeUp}
              className="inline-block rounded-3xl border border-violet-500/20 bg-gradient-to-b from-violet-600/10 to-transparent p-12"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-400 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-violet-900/40">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-4xl font-extrabold text-white mb-4 leading-tight">
                Ready to make your conversations work harder?
              </h2>
              <p className="text-white/40 text-lg mb-8 max-w-lg mx-auto">
                Join 12,000+ businesses using Zephyra to power smarter customer
                interactions. Average setup time: under 15 minutes.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/sign-up"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 font-semibold transition-all duration-200 shadow-xl shadow-violet-900/40 hover:scale-105"
                >
                  Start Free Today
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="#"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 font-medium transition-all duration-200"
                >
                  Book a Strategy Call
                </a>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/5 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-10 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-400 flex items-center justify-center">
                  <Zap className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-lg font-bold">Zephyra</span>
              </div>
              <p className="text-sm text-white/30 leading-relaxed mb-4">
                AI-powered conversational platform for businesses that demand
                results.
              </p>
              <div className="flex gap-3">
                {[Twitter, Github, Linkedin].map((Icon, i) => (
                  <a
                    key={i}
                    href="#"
                    className="w-8 h-8 rounded-lg border border-white/10 hover:border-violet-500/40 flex items-center justify-center text-white/40 hover:text-white transition-all duration-200"
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>

            {[
              {
                title: "Product",
                links: ["Features", "Pricing", "Changelog", "Roadmap"],
              },
              {
                title: "Resources",
                links: ["Documentation", "API Reference", "Blog", "Case Studies"],
              },
              {
                title: "Company",
                links: ["About", "Careers", "Privacy", "Terms"],
              },
            ].map((col) => (
              <div key={col.title}>
                <div className="text-sm font-semibold text-white/70 mb-4">
                  {col.title}
                </div>
                <ul className="space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l}>
                      <a
                        href="#"
                        className="text-sm text-white/30 hover:text-white/70 transition-colors duration-200"
                      >
                        {l}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-sm text-white/20">
              2026 Zephyra. All rights reserved.
            </span>
            <span className="text-sm text-white/20">hello@zephyra.ai</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
