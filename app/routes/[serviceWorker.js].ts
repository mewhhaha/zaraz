import { LoaderFunctionArgs } from "@remix-run/cloudflare";

const script = (version: string) => `
// Establish a cache name
const cacheName = "${version}";

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

export const loader = ({ context }: LoaderFunctionArgs) => {
  return new Response(script(context.cloudflare.env.VERSION), {});
};
