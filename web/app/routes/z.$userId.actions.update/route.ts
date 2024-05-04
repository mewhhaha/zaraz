import { ActionFunctionArgs } from "@remix-run/cloudflare";
import { type } from "arktype";
import { authenticate } from "~/utils/auth";
import { Table } from "~/utils/db";

const updateTodo = async (
  db: D1Database,
  {
    id,
    userId,
    name,
    description,
    image,
  }: {
    id: string;
    userId: string;
    name?: string;
    description?: string;
    image?: string;
  },
) => {
  const todo = await db
    .prepare(`SELECT * FROM todos WHERE id = ? AND user_id = ?`)
    .bind(id, userId)
    .first<Table["todos"]>();

  await db
    .prepare(
      `UPDATE todos SET name = ?, description = ?, image = ? WHERE id = ? AND user_id = ?`,
    )
    .bind(
      name ?? todo?.name,
      description ?? todo?.description,
      image ?? todo?.image,
      id,
      userId,
    )
    .run();
};

const parseFormData = type({
  id: "string",
  "name?": "string",
  "description?": "string",
  "image?": "string",
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

  await updateTodo(context.cloudflare.env.DB, {
    id: data.id,
    name: data.name,
    description: data.description,
    image: data.image,
    userId: user.id,
  });

  return null;
};
