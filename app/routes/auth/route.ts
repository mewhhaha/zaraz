import { LoaderFunctionArgs, redirect } from "@remix-run/cloudflare";
import { generatePath } from "@remix-run/react";
import { authenticate } from "~/utils/auth";

export const loader = async ({ request, context }: LoaderFunctionArgs) => {
  const user = await authenticate(context.cloudflare, request);
  return redirect(generatePath("/z/:userId/home", { userId: user.id }), 302);
};
