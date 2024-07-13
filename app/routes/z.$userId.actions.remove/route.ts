import { ActionFunctionArgs } from "@remix-run/cloudflare";
import { generatePath } from "@remix-run/react";

import { type } from "arktype";
import { authenticate } from "~/utils/auth.server";
import { bust } from "~/utils/cache.server";
import { camelCaseKeysFromSnakeCase, Table } from "~/utils/db.server";
import { invariant } from "~/utils/invariant";

const parseFormData = type({
  id: "string",
});

export const action = async ({ request, context }: ActionFunctionArgs) => {
  invariant(request.method === "DELETE", "Method Not Allowed");

  const user = await authenticate(context.cloudflare, request);
  const formData = await request.formData();
  const data = parseFormData(Object.fromEntries([...formData.entries()]));

  if (data instanceof type.errors) {
    return { summary: data.summary };
  }

  await removeTodo(context.cloudflare.env.DB, user.id, data.id);

  const cacheKey = new Request(
    new URL(
      generatePath("/z/:userId/history", { userId: user.id }),
      new URL(request.url).origin,
    ),
  );

  await bust(context.cloudflare, { cacheKey, namespace: "todos" });

  return null;
};

const removeTodo = async (db: D1Database, userId: string, id: string) => {
  const select = db
    .prepare(`SELECT * FROM todos WHERE user_id=? AND id=?`)
    .bind(userId, id);
  const remove = db
    .prepare(`DELETE FROM todos WHERE user_id=? AND id=?`)
    .bind(userId, id);

  const [result] = await db.batch([select, remove]);
  return camelCaseKeysFromSnakeCase(result.results[0] as Table["todos"]);
};
