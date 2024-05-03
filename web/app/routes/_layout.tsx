import { NavLink, NavLinkProps, Outlet } from "@remix-run/react";
import { cx } from "~/styles/cx";

type HeaderLink = { to: string; label: string };

const links = [
  { to: "/home", label: "home" },
  { to: "/vacation", label: "vacation" },
] as const satisfies HeaderLink[];

export default function Layout() {
  return (
    <div className="pl-32">
      <header className="fixed inset-y-0 left-0 w-32 bg-yellow-100">
        <nav className="h-full border p-4">
          <ul className="flex flex-col gap-3">
            {links.map((link) => {
              return (
                <li key={link.to} className="flex w-full">
                  <HeaderNavLink to={link.to}>{link.label}</HeaderNavLink>
                </li>
              );
            })}
          </ul>
        </nav>
      </header>
      <Outlet />
    </div>
  );
}

const HeaderNavLink = (props: NavLinkProps) => {
  return (
    <NavLink
      {...props}
      className={(active) => {
        return cx(
          "w-full px-2 py-1",
          active.isActive
            ? "bg-gray-100 text-black before:content-['@']"
            : "border text-blue-600 before:content-['~'] hover:bg-purple-200 hover:text-black",
          typeof props.className === "function"
            ? props.className(active)
            : props.className,
        );
      }}
    />
  );
};
