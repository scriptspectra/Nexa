"use client";

import React, { Component, ReactNode } from "react";

export class ErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 m-8 bg-red-900/50 border border-red-500 rounded-lg text-white font-mono z-50 relative">
          <h2 className="text-xl font-bold mb-4">Client-side Exception Caught!</h2>
          <pre className="text-sm bg-black/50 p-4 rounded overflow-auto mb-4 text-red-200">
            {this.state.error?.name}: {this.state.error?.message}
          </pre>
          <pre className="text-xs bg-black/50 p-4 rounded overflow-auto text-gray-400">
            {this.state.error?.stack}
          </pre>
          <p className="mt-4 text-sm font-sans">
            Please screenshot this error and send it to your developer.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}
