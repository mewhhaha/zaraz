import { ActionFunctionArgs } from "@remix-run/cloudflare";
import { type } from "arktype";
import { authenticate } from "~/utils/auth";

const resortTodo = async (
  db: D1Database,
  { id, userId }: { id: string; userId: string },
) => {
  await db
    .prepare(
      `UPDATE todos SET priority = ((SELECT MAX(priority) FROM todos WHERE user_id = ?) + 1) WHERE id = ? AND user_id = ?`,
    )
    .bind(userId, id, userId)
    .run();
};

const parseFormData = type({
  id: "string",
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

  await resortTodo(context.cloudflare.env.DB, {
    id: data.id,
    userId: user.id,
  });

  return null;
};
