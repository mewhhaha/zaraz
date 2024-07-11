import { LoaderFunctionArgs, redirect } from "@remix-run/cloudflare";
import { generatePath } from "@remix-run/react";
import { authenticate } from "~/utils/auth.server";

export const loader = async ({ request, context }: LoaderFunctionArgs) => {
  try {
    const user = await authenticate(context.cloudflare, request);
    return redirect(generatePath("/z/:userId/home", { userId: user.id }));
  } catch {
    return redirect(`/401`);
  }
};
