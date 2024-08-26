const script = `
// Establish a cache name
const cacheName = "${import.meta.env.VITE_VERSION}";

self.addEventListener("fetch", (event) => {
 
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
