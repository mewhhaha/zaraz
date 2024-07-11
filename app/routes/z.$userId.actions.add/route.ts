import { ActionFunctionArgs } from "@remix-run/cloudflare";
import { generatePath } from "@remix-run/react";

import { type } from "arktype";
import { authenticate } from "~/utils/auth";
import { bust } from "~/utils/cache";
import { Table } from "~/utils/db";

const parseFormData = type({
  name: "string",
});

export const action = async ({ request, context }: ActionFunctionArgs) => {
  const user = await authenticate(context.cloudflare, request);
  const formData = await request.formData();
  const { data, problems } = parseFormData(
    Object.fromEntries([...formData.entries()]),
  );

  if (problems) {
    return { summary: problems.summary };
  }

  const id = crypto.randomUUID();

  const row = generateRow({ id, userId: user.id, name: data.name });

  await addTop(context.cloudflare.env.DB, row);

  const cacheKey = new Request(
    new URL(
      generatePath("/z/:userId/home", { userId: user.id }),
      new URL(request.url).origin,
    ),
  );
  await bust(context.cloudflare, { cacheKey, namespace: "todos" });

  return null;
};

const addTop = async (db: D1Database, row: Table["todos"]) => {
  const keys = Object.keys(row);
  const qs = new Array(keys.length).fill("?");
  const values = Object.values(row);

  const insert = db
    .prepare(`INSERT INTO todos (${keys}) VALUES (${qs})`)
    .bind(...values);

  const increment = db
    .prepare(
      `UPDATE todos SET priority = priority + 1 WHERE user_id = ? AND done = ? AND id != ? `,
    )
    .bind(row.user_id, false, row.id);

  await db.batch([increment, insert]);
};

const generateRow = ({
  userId,
  id,
  name,
}: {
  userId: string;
  id: string;
  name: string;
}) => {
  const date = new Date().toISOString();
  const row: Table["todos"] = {
    id,
    name,
    user_id: userId,
    priority: 0,
    done_at: new Date(0).toISOString(),
    created_at: date,
    updated_at: date,
    done: false,
  };

  return row;
};
