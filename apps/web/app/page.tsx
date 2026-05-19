"use client";

import Link from "next/link";
import { Terminal, Mic, Activity, ArrowRight, CheckCircle } from "lucide-react";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { ThemeToggle } from "@/components/theme-toggle";

export default function LandingPage() {
  return (
    <div className="antialiased min-h-screen bg-background text-foreground font-sans selection:bg-amber-500/30">
      {/* TopNavBar */}
      <nav className="fixed top-0 w-full z-50 bg-background/70 backdrop-blur-xl border-b border-border shadow-sm duration-300 ease-in-out">
        <div className="flex justify-between items-center h-20 px-6 md:px-10 max-w-[1440px] mx-auto">
          <div className="text-2xl font-bold text-foreground tracking-tight">Nexa</div>
          <div className="hidden md:flex items-center space-x-12">
            <a className="text-amber-500 font-semibold active-nav-indicator text-base hover:opacity-80 transition-opacity" href="#">Platform</a>
            <a className="text-muted-foreground hover:text-foreground transition-colors text-base" href="#">Solutions</a>
            <a className="text-muted-foreground hover:text-foreground transition-colors text-base" href="#">Resources</a>
            <a className="text-muted-foreground hover:text-foreground transition-colors text-base" href="#">Pricing</a>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <SignedOut>
              <Link href="/sign-in" className="hidden md:block text-foreground text-base hover:opacity-80 transition-opacity">
                Sign In
              </Link>
              <Link href="/sign-up" className="bg-amber-500 text-amber-950 px-6 py-2.5 rounded-lg font-semibold shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:shadow-[0_0_30px_rgba(245,158,11,0.4)] hover:bg-amber-400 transition-all">
                Get Started
              </Link>
            </SignedOut>
            <SignedIn>
              <Link href="/conversations" className="bg-amber-500 text-amber-950 px-6 py-2.5 rounded-lg font-semibold shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:shadow-[0_0_30px_rgba(245,158,11,0.4)] hover:bg-amber-400 transition-all">
                Dashboard
              </Link>
            </SignedIn>
          </div>
        </div>
      </nav>

      <main className="pt-20">
        {/* Hero Section */}
        <section className="relative px-6 md:px-10 py-20 max-w-[1440px] mx-auto overflow-hidden">
          <div className="absolute top-0 right-0 -z-10 w-[600px] h-[600px] bg-amber-500/10 blur-[120px] rounded-full"></div>
          <div className="absolute bottom-0 left-0 -z-10 w-[400px] h-[400px] bg-blue-500/10 blur-[100px] rounded-full"></div>
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="max-w-2xl">
              <span className="inline-block px-3 py-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-semibold tracking-widest uppercase rounded-full mb-6">
                V2.0 NOW LIVE
              </span>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 tracking-tighter leading-tight">
                Customer Support, Automated by AI. <span className="text-amber-500">Perfected by Humans.</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-12 leading-relaxed">
                Deploy production-ready AI agents trained on your documentation in minutes. Seamlessly hand off complex queries to human operators when precision is non-negotiable.
              </p>
              <div className="flex flex-wrap gap-6">
                <Link href="/sign-up" className="bg-amber-500 px-8 py-4 rounded-lg text-amber-950 font-bold shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:shadow-[0_0_30px_rgba(245,158,11,0.4)] hover:bg-amber-400 transition-all">
                  Start for Free
                </Link>
                <button className="border border-border bg-background/50 px-8 py-4 rounded-lg text-foreground font-bold hover:bg-accent transition-all">
                  Book a Demo
                </button>
              </div>
            </div>
            <div className="relative lg:h-[600px] flex items-center justify-center mt-12 lg:mt-0">
              <div className="bg-background/50 backdrop-blur-xl border border-border w-full h-[480px] rounded-xl overflow-hidden shadow-2xl relative">
                <img 
                  alt="Nexa Dashboard" 
                  className="w-full h-full object-cover opacity-80" 
                  src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=2070" 
                />
                {/* Overlay interface elements */}
                <div className="absolute top-4 left-4 right-4 h-12 bg-background/80 backdrop-blur-md rounded-lg flex items-center px-6 border border-border">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  </div>
                  <div className="mx-auto text-xs font-semibold tracking-widest uppercase text-muted-foreground">
                    nexa-ai-agent-v2-production
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Bento Grid */}
        <section className="px-6 md:px-10 py-20 max-w-[1440px] mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-3 tracking-tighter text-foreground">Engineered for Precision</h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Beyond simple chatbots. We build intelligent infrastructure for the modern enterprise.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-background/50 backdrop-blur-xl border border-border p-12 rounded-xl group hover:border-amber-500/50 transition-all cursor-pointer">
              <div className="w-12 h-12 bg-amber-500/10 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Terminal className="text-amber-500 w-6 h-6" />
              </div>
              <h3 className="text-2xl font-semibold mb-3 text-foreground">RAG Knowledge Base</h3>
              <p className="text-base text-muted-foreground leading-relaxed">
                Sync your documentation, Notion pages, and Slack history. Our RAG engine ensures responses are grounded in your reality, not hallucinations.
              </p>
              <div className="mt-6 flex items-center text-amber-500 font-semibold gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                Explore documentation <ArrowRight className="w-4 h-4" />
              </div>
            </div>
            
            <div className="bg-background/50 backdrop-blur-xl border border-border p-12 rounded-xl group hover:border-amber-500/50 transition-all cursor-pointer">
              <div className="w-12 h-12 bg-amber-500/10 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Mic className="text-amber-500 w-6 h-6" />
              </div>
              <h3 className="text-2xl font-semibold mb-3 text-foreground">AI Voice Assistants</h3>
              <p className="text-base text-muted-foreground leading-relaxed">
                Low-latency, natural sounding voice interactions. Handle phone inquiries with the same precision as your digital chat agents.
              </p>
              <div className="mt-6 flex items-center text-amber-500 font-semibold gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                Listen to samples <ArrowRight className="w-4 h-4" />
              </div>
            </div>
            
            <div className="bg-background/50 backdrop-blur-xl border border-border p-12 rounded-xl group hover:border-amber-500/50 transition-all cursor-pointer">
              <div className="w-12 h-12 bg-amber-500/10 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Activity className="text-amber-500 w-6 h-6" />
              </div>
              <h3 className="text-2xl font-semibold mb-3 text-foreground">Operator Dashboard</h3>
              <p className="text-base text-muted-foreground leading-relaxed">
                Real-time sentiment monitoring and seamless hand-offs. Your human team intervenes only when the AI reaches its confidence threshold.
              </p>
              <div className="mt-6 flex items-center text-amber-500 font-semibold gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                View demo <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="px-6 md:px-10 py-20 bg-muted/30 border-y border-border">
          <div className="max-w-[1440px] mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold mb-3 tracking-tighter text-foreground">Scale with Precision</h2>
              <p className="text-lg text-muted-foreground">Plans that evolve alongside your customer base.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6 items-end mt-12">
              
              <div className="bg-background/50 backdrop-blur-xl border border-border p-12 rounded-xl flex flex-col h-full mt-8 md:mt-0">
                <div className="mb-12">
                  <div className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-1.5">FOR SMALL TEAMS</div>
                  <div className="text-2xl font-semibold mb-1.5 text-foreground">Starter</div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl md:text-5xl font-bold text-foreground">$29</span>
                    <span className="text-muted-foreground text-base">/mo</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-12 flex-grow">
                  <li className="flex items-center gap-3 text-muted-foreground">
                    <CheckCircle className="text-amber-500 w-5 h-5 flex-shrink-0" /> 1,000 Messages/mo
                  </li>
                  <li className="flex items-center gap-3 text-muted-foreground">
                    <CheckCircle className="text-amber-500 w-5 h-5 flex-shrink-0" /> 1 Knowledge Base
                  </li>
                  <li className="flex items-center gap-3 text-muted-foreground">
                    <CheckCircle className="text-amber-500 w-5 h-5 flex-shrink-0" /> Web Widget Only
                  </li>
                </ul>
                <Link href="/sign-up" className="w-full py-4 border border-border rounded-lg hover:bg-accent transition-all font-bold text-center block text-foreground">
                  Get Started
                </Link>
              </div>
              
              <div className="bg-background p-12 rounded-xl border border-amber-500/50 relative transform md:scale-105 shadow-[0_0_40px_rgba(245,158,11,0.15)] flex flex-col h-full z-10">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-500 px-6 py-1.5 rounded-full text-amber-950 text-xs font-semibold tracking-widest uppercase shadow-lg whitespace-nowrap">
                  MOST POPULAR
                </div>
                <div className="mb-12">
                  <div className="text-xs font-semibold tracking-widest uppercase text-amber-500 mb-1.5">FOR GROWTH</div>
                  <div className="text-2xl font-semibold mb-1.5 text-foreground">Pro</div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl md:text-5xl font-bold text-amber-500">$79</span>
                    <span className="text-muted-foreground text-base">/mo</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-12 flex-grow">
                  <li className="flex items-center gap-3 text-foreground">
                    <CheckCircle className="text-amber-500 w-5 h-5 flex-shrink-0" /> 5,000 Messages/mo
                  </li>
                  <li className="flex items-center gap-3 text-foreground">
                    <CheckCircle className="text-amber-500 w-5 h-5 flex-shrink-0" /> Unlimited Knowledge Bases
                  </li>
                  <li className="flex items-center gap-3 text-foreground">
                    <CheckCircle className="text-amber-500 w-5 h-5 flex-shrink-0" /> Live Operator Dashboard
                  </li>
                  <li className="flex items-center gap-3 text-foreground">
                    <CheckCircle className="text-amber-500 w-5 h-5 flex-shrink-0" /> Advanced Analytics
                  </li>
                </ul>
                <Link href="/sign-up" className="w-full py-4 bg-amber-500 rounded-lg text-amber-950 shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:shadow-[0_0_30px_rgba(245,158,11,0.4)] hover:bg-amber-400 transition-all font-bold text-center block">
                  Try 14 Days Free
                </Link>
              </div>
              
              <div className="bg-background/50 backdrop-blur-xl border border-border p-12 rounded-xl flex flex-col h-full mt-8 md:mt-0">
                <div className="mb-12">
                  <div className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-1.5">FOR SCALE</div>
                  <div className="text-2xl font-semibold mb-1.5 text-foreground">Enterprise Voice</div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl md:text-5xl font-bold text-foreground">Custom</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-12 flex-grow">
                  <li className="flex items-center gap-3 text-muted-foreground">
                    <CheckCircle className="text-amber-500 w-5 h-5 flex-shrink-0" /> Unlimited Volume
                  </li>
                  <li className="flex items-center gap-3 text-muted-foreground">
                    <CheckCircle className="text-amber-500 w-5 h-5 flex-shrink-0" /> Vapi Voice Integration
                  </li>
                  <li className="flex items-center gap-3 text-muted-foreground">
                    <CheckCircle className="text-amber-500 w-5 h-5 flex-shrink-0" /> Dedicated Account Manager
                  </li>
                  <li className="flex items-center gap-3 text-muted-foreground">
                    <CheckCircle className="text-amber-500 w-5 h-5 flex-shrink-0" /> 24/7 Priority Support
                  </li>
                </ul>
                <button className="w-full py-4 border border-border rounded-lg hover:bg-accent transition-all font-bold text-foreground">
                  Talk to Sales
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-6 md:px-10 py-20 max-w-[1440px] mx-auto text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-amber-500/5 -z-10 rounded-3xl blur-3xl"></div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tighter text-foreground">Ready to automate with precision?</h2>
          <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto">
            Join 500+ enterprises who have reduced support ticket volume by 65% while increasing CSAT scores.
          </p>
          <Link href="/sign-up" className="inline-block bg-amber-500 px-8 py-4 rounded-lg text-amber-950 font-bold shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:shadow-[0_0_30px_rgba(245,158,11,0.4)] hover:bg-amber-400 text-2xl transition-all">
            Deploy Your First AI Agent
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-border bg-muted/20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 px-6 md:px-10 py-20 max-w-[1440px] mx-auto">
          <div className="col-span-2 md:col-span-1">
            <div className="text-2xl font-bold text-foreground mb-6">Nexa</div>
            <p className="text-muted-foreground text-base max-w-xs">
              Building the future of human-AI collaboration in customer experience. Precision in every interaction.
            </p>
          </div>
          <div>
            <h4 className="text-xs font-semibold tracking-widest uppercase text-foreground mb-6">Product</h4>
            <nav className="flex flex-col gap-3">
              <a className="text-muted-foreground hover:text-amber-500 transition-colors text-base" href="#">Features</a>
              <a className="text-muted-foreground hover:text-amber-500 transition-colors text-base" href="#">Integrations</a>
              <a className="text-muted-foreground hover:text-amber-500 transition-colors text-base" href="#">API Reference</a>
              <a className="text-muted-foreground hover:text-amber-500 transition-colors text-base" href="#">Pricing</a>
            </nav>
          </div>
          <div>
            <h4 className="text-xs font-semibold tracking-widest uppercase text-foreground mb-6">Company</h4>
            <nav className="flex flex-col gap-3">
              <a className="text-muted-foreground hover:text-amber-500 transition-colors text-base" href="#">About Us</a>
              <a className="text-muted-foreground hover:text-amber-500 transition-colors text-base" href="#">Careers</a>
              <a className="text-muted-foreground hover:text-amber-500 transition-colors text-base" href="#">Privacy Policy</a>
              <a className="text-muted-foreground hover:text-amber-500 transition-colors text-base" href="#">Terms of Service</a>
            </nav>
          </div>
          <div>
            <h4 className="text-xs font-semibold tracking-widest uppercase text-foreground mb-6">Connect</h4>
            <nav className="flex flex-col gap-3">
              <a className="text-muted-foreground hover:text-amber-500 transition-colors text-base" href="#">X (Twitter)</a>
              <a className="text-muted-foreground hover:text-amber-500 transition-colors text-base" href="#">LinkedIn</a>
              <a className="text-muted-foreground hover:text-amber-500 transition-colors text-base" href="#">GitHub</a>
            </nav>
          </div>
        </div>
        <div className="max-w-[1440px] mx-auto px-6 md:px-10 py-6 border-t border-border text-center md:text-left text-muted-foreground text-sm">
          © 2026 Nexa AI. All rights reserved. Precision in support.
        </div>
      </footer>
    </div>
  );
}
