import { NextResponse } from 'next/server';
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Select Clerk credentials based on build environment.
const isProd = process.env.NODE_ENV === 'production';
const clerkPublishableKey = isProd
  ? process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY_PROD!
  : process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY_DEV!;
const clerkSecretKey = isProd
  ? process.env.CLERK_SECRET_KEY_PROD!
  : process.env.CLERK_SECRET_KEY_DEV!;

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/shopify/callback",
  "/privacy",
]);

const isOrgFreeRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/org-selection(.*)"
]);

export default clerkMiddleware(
  async (auth, req) => {
    const { userId, orgId } = await auth();

    if (!isPublicRoute(req)) {
      await auth.protect();
    }

    if (userId && !orgId && !isOrgFreeRoute(req)) {
      const searchParams = new URLSearchParams({ redirectUrl: req.url });

      const orgSelection = new URL(
        `/org-selection?${searchParams.toString()}`,
        req.url,
      );

      return NextResponse.redirect(orgSelection);
    }
  },
  {
    publishableKey: clerkPublishableKey,
    secretKey: clerkSecretKey,
  }
);

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
