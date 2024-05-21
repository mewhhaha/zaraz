import { LoaderFunctionArgs, redirect } from "@remix-run/cloudflare";
import { authenticate } from "~/utils/auth";

export const loader = async ({ request, context }: LoaderFunctionArgs) => {
  const user = await authenticate(context.cloudflare, request);
  return redirect(`/u/${user}`, 302);
};
