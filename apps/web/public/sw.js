self.addEventListener("push", function (event) {
  if (event.data) {
    try {
      const data = event.data.json();
      const options = {
        body: data.body,
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        data: {
          url: data.url || "/conversations",
        },
      };
      event.waitUntil(
        self.registration.showNotification(data.title || "Zephyra", options)
      );
    } catch (e) {
      const options = {
        body: event.data.text(),
        icon: "/favicon.ico",
        badge: "/favicon.ico",
      };
      event.waitUntil(
        self.registration.showNotification("Zephyra", options)
      );
    }
  }
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientList) {
      const urlToOpen = event.notification.data?.url || "/conversations";
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(urlToOpen) && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

self.addEventListener("fetch", function (event) {
  // Pass-through fetch handler for PWA installation criteria
  event.respondWith(
    fetch(event.request).catch(function () {
      return new Response("Offline");
    })
  );
});
