const script = `
// Establish a cache name
const cacheName = "${import.meta.env.VITE_VERSION}";

self.addEventListener("fetch", (event) => {
  if (event.request.destination === "image") {
    event.respondWith(
      caches.open(cacheName).then(async (cache) => {
        const cachedResponse = await cache.match(event.request);
        const fetchedResponse = fetch(event.request).then((networkResponse) => {
          cache.put(event.request, networkResponse.clone());

          return networkResponse;
        });
        return cachedResponse || fetchedResponse;
      }),
    );
  } else {
    return;
  }
});
`;

export const loader = () => {
  return new Response(script, {
    status: 200,
    headers: {
      "Cache-Control":
        "public, max-age=14400, s-maxage=604800, must-revalidate",
      "Content-Type": "application/javascript",
    },
  });
};
