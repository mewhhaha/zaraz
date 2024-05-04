import { LoaderFunctionArgs, redirect } from "@remix-run/cloudflare";
import {
  failure,
  exchangeCode,
  findReturnResponse,
  serializeUserCookie,
} from "~/utils/auth";
import { Table } from "~/utils/db";

export const loader = async ({ request, context }: LoaderFunctionArgs) => {
  const url = new URL(request.url);

  const token = await exchangeCode(context.cloudflare, url);
  if (token instanceof failure) {
    console.error(token.message);
    return token.response;
  }

  let user = await findUser(context.cloudflare.env.DB, {
    oauthId: token.id,
    provider: "google",
  });

  if (!user) {
    const id = crypto.randomUUID();
    user = await insertUser(context.cloudflare.env.DB, {
      id,
      email: token.email,
      oauthId: token.id,
      provider: "google",
    });
  }

  if (!user) {
    return redirect("/auth");
  }

  const serializedCookie = await serializeUserCookie(context.cloudflare, user);

  const response = await findReturnResponse(context.cloudflare, url);
  if (response) {
    response.headers.set("Set-Cookie", serializedCookie);
    return response;
  }

  return redirect("/", { headers: { "Set-Cookie": serializedCookie } });
};

const findUser = async (
  db: D1Database,
  { oauthId, provider }: { oauthId: string; provider: string },
) => {
  const first = await db
    .prepare(`SELECT * FROM users WHERE oauth_id = ? AND provider = ? LIMIT 1`)
    .bind(oauthId, provider)
    .first<Table["users"]>();

  return first;
};

const insertUser = async (
  db: D1Database,
  {
    id,
    email,
    oauthId,
    provider,
  }: { id: string; email: string; oauthId: string; provider: string },
) => {
  const date = new Date().toISOString();

  const row: Table["users"] = {
    id,
    oauth_id: oauthId,
    created_at: date,
    updated_at: date,
    email,
    provider,
    name: id,
  };

  const keys = Object.keys(row);
  const qs = new Array(keys.length).fill("?");
  const values = Object.values(row);

  console.log(`INSERT INTO users (${keys}) VALUES (${qs})`);
  await db
    .prepare(`INSERT INTO users (${keys}) VALUES (${qs})`)
    .bind(...values)
    .run();

  return findUser(db, { oauthId, provider });
};
