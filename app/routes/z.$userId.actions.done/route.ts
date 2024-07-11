import { ActionFunctionArgs } from "@remix-run/cloudflare";
import { type } from "arktype";
import { authenticate } from "~/utils/auth.server";

const doneTodo = async (
  db: D1Database,
  { id, userId }: { id: string; userId: string },
) => {
  const date = new Date().toISOString();

  await db
    .prepare(
      `UPDATE todos SET done = ?, done_at = ? WHERE id = ? AND user_id = ?`,
    )
    .bind(true, date, id, userId)
    .run();
};

const parseFormData = type({
  id: "string",
});

export const action = async ({ request, context }: ActionFunctionArgs) => {
  const user = await authenticate(context.cloudflare, request);
  const formData = await request.formData();
  const data = parseFormData(Object.fromEntries([...formData.entries()]));

  if (data instanceof type.errors) {
    return { summary: data.summary };
  }

  await doneTodo(context.cloudflare.env.DB, {
    id: data.id,
    userId: user.id,
  });

  return null;
};
