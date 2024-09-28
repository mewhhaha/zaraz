export const swr = async <T>(
  cf: CloudflareContext,
  task: Promise<T>,
  { cacheKey, namespace }: { cacheKey: Request; namespace: "todos" },
) => {
  const cache = await cf.caches.open(namespace);

  const cached = await cache.match(cacheKey);

  const revalidate = async () => {
    const data = await task;
    const response = new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
    await cache.put(cacheKey, response);
  };

  cf.ctx.waitUntil(revalidate());

  if (cached) {
    return (await cached.json()) as Awaited<typeof task>;
  }

  return await task;
};

export const bust = async (
  cf: CloudflareContext,
  { cacheKey, namespace }: { cacheKey: Request; namespace: "todos" },
) => {
  const cache = await cf.caches.open(namespace);
  try {
    await cache.delete(cacheKey);
  } catch {
    // ignore
  }
};
