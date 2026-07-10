"use node";

import { internalAction } from "../_generated/server";
import { v } from "convex/values";
import webpush from "web-push";
import { internal } from "../_generated/api";

export const sendNotificationAction = internalAction({
  args: {
    userIds: v.array(v.string()),
    title: v.string(),
    body: v.string(),
    url: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
    
    if (!vapidPublicKey || !vapidPrivateKey) {
      console.warn("VAPID_PUBLIC_KEY or VAPID_PRIVATE_KEY not set. Skipping push notification dispatch.");
      return;
    }

    webpush.setVapidDetails(
      "mailto:support@zephyra.ai",
      vapidPublicKey,
      vapidPrivateKey
    );

    // Call getSubscriptions query in V8 runtime
    const subscriptions = await ctx.runQuery(internal.private.push.getSubscriptions, {
      userIds: args.userIds,
    });

    const payload = JSON.stringify({
      title: args.title,
      body: args.body,
      url: args.url || "/conversations",
    });

    await Promise.allSettled(
      subscriptions.map(async (sub: any) => {
        try {
          const pushSubscription = {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.keys.p256dh,
              auth: sub.keys.auth,
            },
          };
          await webpush.sendNotification(pushSubscription, payload);
        } catch (error: any) {
          // If the endpoint is expired or invalid, remove it
          if (error.statusCode === 410 || error.statusCode === 404) {
            console.log(`Removing expired push subscription for endpoint: ${sub.endpoint}`);
            await ctx.scheduler.runAfter(0, internal.private.push.removeSubscription, {
              id: sub._id,
            });
          } else {
            console.error("Web Push delivery error:", error);
          }
        }
      })
    );
  },
});
