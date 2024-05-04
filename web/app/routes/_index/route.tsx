import { LoaderFunctionArgs, redirect } from "@remix-run/cloudflare";
import { authenticate } from "~/utils/auth";

export const loader = async ({ request, context }: LoaderFunctionArgs) => {
  try {
    const user = await authenticate(context.cloudflare, request);
    return redirect(`/z/${user.id}`);
  } catch {
    return redirect(`/401`);
  }
};
