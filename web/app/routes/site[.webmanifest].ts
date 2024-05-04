export const loader = () => {
  return new Response(
    JSON.stringify({
      name: "Zaraz",
      short_name: "zaraz",
      id: "0.0.1",
      start_url: "/",
      display: "standalone",
      background_color: "#fff",
      theme_color: "#000",
      icons: [
        {
          src: "/android-chrome-192x192.png",
          sizes: "192x192",
          type: "image/png",
        },
        {
          src: "/android-chrome-512x512.png",
          sizes: "512x512",
          type: "image/png",
        },
      ],
    }),
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
};
