import { LoaderFunctionArgs } from "@remix-run/cloudflare";
import { logout } from "~/utils/auth.server";

export const loader = async ({ context }: LoaderFunctionArgs) => {
  return logout(context.cloudflare, "/");
};
