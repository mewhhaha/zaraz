import {
  Link,
  NavLink,
  NavLinkProps,
  Outlet,
  useNavigation,
} from "@remix-run/react";
import { Suspense } from "react";

import { Phonetic } from "~/components/Phonetic";
import { Subtitle } from "~/components/Subtitle";
import { Heading1 } from "~/components/Title";
import { cx } from "~/styles/cx";

export default function Route() {
  const navigation = useNavigation();
  const loading = navigation.state !== "idle";

  return (
    <>
      <header>
        <ProgressBar
          className={cx(
            "fixed left-0 top-0 h-1 w-full transition-opacity duration-75 ease-in",

            "after:absolute after:left-0 after:top-0 after:size-1 after:w-full after:origin-left after:bg-blue-500 after:transition-transform after:duration-1000",
            loading
              ? "opacity-100 after:scale-x-100"
              : "opacity-0 after:scale-x-0",
          )}
        />
        <div className="flex items-start">
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
        <nav className="px-1">
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

type ProgressBarProps = JSX.IntrinsicElements["progress"];
const ProgressBar = (props: ProgressBarProps) => {
  return <progress value={1} {...props} />;
};

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
