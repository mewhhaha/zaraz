import { LoaderFunctionArgs } from "@remix-run/cloudflare";
import { Link, NavLink, NavLinkProps, Outlet } from "@remix-run/react";
import { authenticate } from "~/utils/auth";

import { Phonetic } from "~/components/Phonetic";
import { Subtitle } from "~/components/Subtitle";
import { Heading1 } from "~/components/Title";
import { cx } from "~/styles/cx";

export const loader = async ({ request, context }: LoaderFunctionArgs) => {
  await authenticate(context.cloudflare, request);
  return null;
};

export default function Route() {
  return (
    <>
      <header>
        <div className="flex">
          <hgroup className="p-1">
            <Heading1 aria-describedby="desription">
              zaraz
              <Phonetic> /zaras/</Phonetic>
            </Heading1>
            <Subtitle id="description">
              {"Zaraz to zrobię, I'll do it in a moment"}
            </Subtitle>
          </hgroup>
          <Link
            className="px-2 text-black underline underline-offset-2 hover:bg-black hover:text-white"
            to="/logout"
          >
            logout
          </Link>
        </div>
        <nav>
          <ul className="flex gap-2">
            <li>
              <PageLink to="home">Home</PageLink>
            </li>
            <li>
              <PageLink to="add">Add task</PageLink>
            </li>
            <li>
              <PageLink to="history">History</PageLink>
            </li>
          </ul>
        </nav>
      </header>
      <Outlet />
    </>
  );
}

type PageLinkProps = NavLinkProps;

export const PageLink = (props: PageLinkProps) => {
  return (
    <NavLink
      {...props}
      className={({ isActive }) =>
        cx(
          "px-2 underline-offset-2",
          isActive
            ? "bg-gray-500 text-white"
            : "text-blue-600 underline hover:bg-black hover:text-white",
        )
      }
    />
  );
};
