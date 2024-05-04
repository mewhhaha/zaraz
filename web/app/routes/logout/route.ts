import { LoaderFunctionArgs } from "@remix-run/cloudflare";
import { logout } from "~/utils/auth";

export const loader = async ({ context }: LoaderFunctionArgs) => {
  return logout(context.cloudflare, "/");
};
