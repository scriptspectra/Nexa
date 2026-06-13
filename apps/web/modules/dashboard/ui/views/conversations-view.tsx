"use client";

import React from "react";

export const ConversationsView = () => {
  return (
    <div className="flex flex-1 overflow-hidden h-full">
      {/* Conversation Sidebar (Active List) */}
      <section className="w-80 border-r border-outline-variant flex flex-col bg-surface-dim">
        <div className="h-16 flex items-center px-sm border-b border-outline-variant">
          <div className="relative w-full">
            <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
            <input className="w-full bg-background border border-outline-variant py-1.5 pl-9 pr-3 text-label-sm font-label-sm focus:outline-none focus:border-primary" placeholder="Search chats..." type="text" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {/* Selected Chat */}
          <div className="p-sm bg-surface-container-high border-b border-outline-variant relative cursor-pointer">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
            <div className="flex justify-between items-start mb-1">
              <span className="text-body-sm font-bold text-primary">Mangala Gunasekara</span>
              <span className="text-label-sm text-on-surface-variant">2m</span>
            </div>
            <p className="text-body-sm text-on-surface-variant truncate">The app crashes when I try to upload my KYC documents...</p>
            <div className="mt-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
              <span className="text-[10px] font-label-sm uppercase text-error tracking-wider">Priority</span>
            </div>
          </div>
          {/* Other Chat Items */}
          <div className="p-sm hover:bg-surface-container-low border-b border-outline-variant cursor-pointer transition-colors">
            <div className="flex justify-between items-start mb-1">
              <span className="text-body-sm font-medium text-on-surface">Alex Rivera</span>
              <span className="text-label-sm text-on-surface-variant">14m</span>
            </div>
            <p className="text-body-sm text-on-surface-variant truncate">How do I reset my API secret key for production?</p>
          </div>
          <div className="p-sm hover:bg-surface-container-low border-b border-outline-variant cursor-pointer transition-colors">
            <div className="flex justify-between items-start mb-1">
              <span className="text-body-sm font-medium text-on-surface">Sarah Chen</span>
              <span className="text-label-sm text-on-surface-variant">45m</span>
            </div>
            <p className="text-body-sm text-on-surface-variant truncate">Payment failed but my balance was deducted.</p>
          </div>
          <div className="p-sm hover:bg-surface-container-low border-b border-outline-variant cursor-pointer transition-colors opacity-50">
            <div className="flex justify-between items-start mb-1">
              <span className="text-body-sm font-medium text-on-surface">Marcus Thorne</span>
              <span className="text-label-sm text-on-surface-variant">2h</span>
            </div>
            <p className="text-body-sm text-on-surface-variant truncate">Feature request: dark mode for the dashboard...</p>
            <div className="mt-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-[14px]" data-icon="done_all">done_all</span>
              <span className="text-[10px] font-label-sm uppercase tracking-wider">Resolved</span>
            </div>
          </div>
          {/* More items for scrolling */}
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-sm hover:bg-surface-container-low border-b border-outline-variant cursor-pointer transition-colors opacity-80">
              <div className="flex justify-between items-start mb-1">
                <span className="text-body-sm font-medium text-on-surface">External User #{29 + i}</span>
                <span className="text-label-sm text-on-surface-variant">5h</span>
              </div>
              <p className="text-body-sm text-on-surface-variant truncate">Integrating webhooks with Zapier</p>
            </div>
          ))}
        </div>
      </section>

      {/* Central Chat Area */}
      <section className="flex-1 flex flex-col relative bg-background">
        {/* Top Header for Chat */}
        <header className="h-16 flex items-center justify-between px-lg border-b border-outline-variant">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-surface-container-highest border border-outline-variant flex items-center justify-center text-primary font-bold text-label-sm">
              MG
            </div>
            <div>
              <h2 className="text-body-md font-bold text-primary">Mangala Gunasekara</h2>
              <p className="text-[10px] font-label-sm text-on-surface-variant uppercase">User ID: 8829-XJ2</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="px-2 py-0.5 border border-error text-error text-[10px] font-label-sm uppercase tracking-widest rounded-none flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
              Unresolved
            </span>
            <div className="h-4 w-px bg-outline-variant"></div>
            <button className="text-on-surface-variant hover:text-primary">
              <span className="material-symbols-outlined" data-icon="more_vert">more_vert</span>
            </button>
          </div>
        </header>
        {/* Conversation History */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-lg space-y-gutter flex flex-col">
          {/* System Message */}
          <div className="flex justify-center">
            <span className="text-[10px] font-label-sm text-on-surface-variant uppercase tracking-widest bg-surface-container-low px-3 py-1">Conversation started 09:42 AM</span>
          </div>
          {/* User Bubble */}
          <div className="flex gap-sm max-w-[80%]">
            <div className="flex-1 space-y-1">
              <div className="bg-surface-container-high border border-outline-variant p-sm">
                <p className="text-body-sm text-on-surface">Hello, I'm trying to complete my account verification but the mobile app keeps crashing during the photo upload stage. I've tried restarting but it doesn't work.</p>
              </div>
              <span className="text-[10px] font-label-sm text-on-surface-variant">Mangala • 09:44 AM</span>
            </div>
          </div>
          {/* Operator Bubble */}
          <div className="flex gap-sm max-w-[80%] ml-auto flex-row-reverse">
            <div className="flex-1 space-y-1 text-right">
              <div className="bg-surface-container-high border border-outline-variant p-sm">
                <p className="text-body-sm text-on-surface">Hello Mangala, I'm sorry to hear about that. Could you please specify which device and OS version you are currently using? This will help us isolate the crash report.</p>
              </div>
              <span className="text-[10px] font-label-sm text-on-surface-variant">Operator (version 2) • 09:46 AM • Sent</span>
            </div>
          </div>
          {/* User Bubble */}
          <div className="flex gap-sm max-w-[80%]">
            <div className="flex-1 space-y-1">
              <div className="bg-surface-container-high border border-outline-variant p-sm">
                <p className="text-body-sm text-on-surface">I'm on an iPhone 15 Pro, iOS 17.4. The app version is 2.4.1. It happens right after I grant camera permissions.</p>
              </div>
              <span className="text-[10px] font-label-sm text-on-surface-variant">Mangala • 09:48 AM</span>
            </div>
          </div>
          {/* Visual Divider for "New Messages" */}
          <div className="relative flex py-4 items-center">
            <div className="flex-grow border-t border-outline-variant"></div>
            <span className="flex-shrink mx-4 text-[10px] font-label-sm text-on-surface-variant uppercase tracking-widest">New Messages</span>
            <div className="flex-grow border-t border-outline-variant"></div>
          </div>
        </div>
        {/* Bottom Input */}
        <div className="p-lg border-t border-outline-variant bg-surface-dim">
          <div className="bg-background border border-outline-variant focus-within:border-primary transition-colors flex flex-col">
            <textarea className="bg-transparent border-none focus:ring-0 p-sm text-body-sm font-body-sm resize-none custom-scrollbar outline-none" placeholder="Type your response as an operator..." rows={3}></textarea>
            <div className="flex justify-between items-center px-sm pb-sm">
              <div className="flex gap-4">
                <button className="text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1.5" title="Enhance response">
                  <span className="material-symbols-outlined text-[18px]" data-icon="auto_awesome">auto_awesome</span>
                  <span className="text-[10px] font-label-sm uppercase font-bold">Enhance</span>
                </button>
                <button className="text-on-surface-variant hover:text-primary transition-colors">
                  <span className="material-symbols-outlined text-[18px]" data-icon="attach_file">attach_file</span>
                </button>
                <button className="text-on-surface-variant hover:text-primary transition-colors">
                  <span className="material-symbols-outlined text-[18px]" data-icon="mood">mood</span>
                </button>
              </div>
              <button className="bg-primary text-on-primary flex items-center justify-center p-2 hover:bg-on-background transition-colors active:scale-95">
                <span className="material-symbols-outlined" data-icon="send">send</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Right Detail Pane */}
      <section className="w-80 border-l border-outline-variant flex flex-col bg-surface-container-lowest overflow-y-auto custom-scrollbar">
        {/* Profile Section */}
        <div className="p-lg text-center border-b border-outline-variant">
          <div className="w-20 h-20 rounded-full bg-surface-container-high border border-outline-variant mx-auto mb-sm overflow-hidden flex items-center justify-center">
            <img alt="Avatar" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDoIIlRdGxVHUnQDRJibzjF-YvY4oQf-VD-YQQRdB0Beoc9V8-SuxLfLRWIGk64x6u1fJkwCgND5t9KgqEgZEyUyqHmZac2khZ3M2zD4mEZG30cipMjWWpMCCSje85q2aNiHph-frLTMpU4tjXXPd97Cqbu9UyLRO8ajRj9Tzip32Lq3m3pLyejkLboWkmK3QivwgoLCaDlQUe1zwnP_Rp8QkjZukattbIYTLYLVuzaj_ViUTQ4cUoB_zxCH98FVMoiUJytgVJYuBKk" />
          </div>
          <h3 className="text-body-lg font-bold text-primary">Mangala Gunasekara</h3>
          <p className="text-label-sm text-on-surface-variant mb-4">m.gunasekara@example.com</p>
          <button className="w-full border border-outline-variant bg-background py-2 text-label-sm font-label-sm font-bold uppercase tracking-widest hover:border-primary transition-colors flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-[16px]" data-icon="mail">mail</span>
            Send Email
          </button>
        </div>
        {/* Collapsible Sections */}
        <div className="flex-1">
          {/* Device Info */}
          <details className="group border-b border-outline-variant" open>
            <summary className="flex justify-between items-center p-sm cursor-pointer hover:bg-surface-container-low transition-colors list-none">
              <span className="text-label-md font-label-md uppercase tracking-wider text-primary">Device Information</span>
              <span className="material-symbols-outlined transition-transform group-open:rotate-180" data-icon="expand_more">expand_more</span>
            </summary>
            <div className="px-sm pb-sm space-y-3">
              <div className="flex justify-between">
                <span className="text-label-sm text-on-surface-variant">Device</span>
                <span className="text-label-sm text-primary">iPhone 15 Pro</span>
              </div>
              <div className="flex justify-between">
                <span className="text-label-sm text-on-surface-variant">OS</span>
                <span className="text-label-sm text-primary">iOS 17.4.1</span>
              </div>
              <div className="flex justify-between">
                <span className="text-label-sm text-on-surface-variant">App Version</span>
                <span className="text-label-sm text-primary">2.4.1 (Stable)</span>
              </div>
            </div>
          </details>
          {/* Location & Language */}
          <details className="group border-b border-outline-variant">
            <summary className="flex justify-between items-center p-sm cursor-pointer hover:bg-surface-container-low transition-colors list-none">
              <span className="text-label-md font-label-md uppercase tracking-wider text-primary">Location &amp; Language</span>
              <span className="material-symbols-outlined transition-transform group-open:rotate-180" data-icon="expand_more">expand_more</span>
            </summary>
            <div className="px-sm pb-sm space-y-3">
              <div className="flex justify-between">
                <span className="text-label-sm text-on-surface-variant">IP Address</span>
                <span className="text-label-sm text-primary">192.168.1.1</span>
              </div>
              <div className="flex justify-between">
                <span className="text-label-sm text-on-surface-variant">Region</span>
                <span className="text-label-sm text-primary">Colombo, LK</span>
              </div>
              <div className="flex justify-between">
                <span className="text-label-sm text-on-surface-variant">Timezone</span>
                <span className="text-label-sm text-primary">GMT +5:30</span>
              </div>
            </div>
          </details>
          {/* Session Details */}
          <details className="group border-b border-outline-variant">
            <summary className="flex justify-between items-center p-sm cursor-pointer hover:bg-surface-container-low transition-colors list-none">
              <span className="text-label-md font-label-md uppercase tracking-wider text-primary">Session Details</span>
              <span className="material-symbols-outlined transition-transform group-open:rotate-180" data-icon="expand_more">expand_more</span>
            </summary>
            <div className="px-sm pb-sm space-y-3">
              <div className="flex justify-between">
                <span className="text-label-sm text-on-surface-variant">Last Event</span>
                <span className="text-label-sm text-primary">auth_failed</span>
              </div>
              <div className="flex justify-between">
                <span className="text-label-sm text-on-surface-variant">Duration</span>
                <span className="text-label-sm text-primary">12m 4s</span>
              </div>
            </div>
          </details>
        </div>
      </section>
    </div>
  );
};
