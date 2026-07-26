import Link from "next/link";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-black text-[#e2e2e8] px-6 py-16 sm:py-24">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="border-b border-white/10 pb-6">
          <Link 
            href="/"
            className="text-xs uppercase tracking-widest text-[#3b82f6] hover:underline font-bold mb-4 block"
          >
            ← Back to Home
          </Link>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-sm text-zinc-500 mt-2">
            Last updated: July 26, 2026
          </p>
        </div>

        {/* Content */}
        <div className="space-y-6 text-sm leading-relaxed text-zinc-400">
          <p>
            Welcome to <strong>Zephyra</strong> (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;). We respect your privacy and are committed to protecting the personal data of both our direct users (dashboard operators) and their end-customers (visitors using the chat widget).
          </p>
          <p>
            This Privacy Policy explains how we collect, use, and safeguard information when you use our service, including our website, embeddable widget, and integrations with third-party platforms like Meta (Facebook &amp; Instagram) and Shopify.
          </p>

          <hr className="border-white/5" />

          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">1. Information We Collect</h2>
            <p>
              To provide our omni-channel customer support tools, we collect and process data in several categories:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Account Information:</strong> When you register on Zephyra, we collect authentication data (such as name and email address) processed securely via our identity provider, Clerk.
              </li>
              <li>
                <strong>Customer Support Messages:</strong> We ingest and store messages, metadata, and uploaded attachments exchanged through the chat widget, emails, and connected platforms (Facebook Messenger, Instagram DMs).
              </li>
              <li>
                <strong>Linked Integrations Data:</strong> If you connect Shopify or Meta, we sync metadata needed to fulfill operations (e.g., Shopify product lists, Facebook page details, page access tokens).
              </li>
              <li>
                <strong>Widget Visitor Metadata:</strong> For visitors using the chat widget, we temporarily collect browser details, screen resolution, local timezone, and current page URLs to provide context to the support agent.
              </li>
            </ul>
          </section>

          <hr className="border-white/5" />

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">2. How We Use the Information</h2>
            <p>
              We use the collected information to:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Deliver and operate the unified conversational inbox.</li>
              <li>Generate real-time AI reply suggestions using large language models.</li>
              <li>Synchronize product catalogs and support tickets across your stores and social profiles.</li>
              <li>Handle billing, invoicing, and subscription upgrades securely via Lemon Squeezy.</li>
              <li>Display performance metrics, SLA deadlines, and analytical summaries.</li>
            </ul>
          </section>

          <hr className="border-white/5" />

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">3. Meta API &amp; Platform Data</h2>
            <p>
              Zephyra accesses Meta APIs (Facebook Page and Instagram Messaging) to deliver direct messages to your inbox. 
            </p>
            <p>
              Our storage of Meta data is strictly limited to the conversational history necessary for support agents to manage active support threads. We do not use Facebook/Instagram user data for marketing, profile building, or any other commercial purposes outside of active customer support operations.
            </p>
          </section>

          <hr className="border-white/5" />

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">4. Data Deletion and Revocation</h2>
            <p>
              You can revoke our access to your data at any time:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Meta Data Deletion:</strong> You can disconnect your Facebook and Instagram channels directly from the <em>Channels</em> tab in our dashboard. Disconnecting instantly deletes associated access tokens, webhooks, page metadata, and linked conversations from our active databases.
              </li>
              <li>
                <strong>General Request:</strong> To request complete deletion of your account or customer data, you can email our support desk at <code className="text-zinc-300">support@zephyrapp.it.com</code>. We will execute your request within 30 days.
              </li>
            </ul>
          </section>

          <hr className="border-white/5" />

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">5. Security</h2>
            <p>
              We take data security seriously. All database access (hosted on Convex) is isolated per organization using strict authorization rules (AuthGuard). Data in transit is encrypted using TLS, and critical integration tokens are stored with secure encryption.
            </p>
          </section>

        </div>

        {/* Footer */}
        <div className="border-t border-white/10 pt-6 text-center text-xs text-zinc-600">
          <p>© 2026 Zephyra. All rights reserved.</p>
        </div>

      </div>
    </div>
  );
}
