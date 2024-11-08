import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import "./tailwind.css";
import { useContext, useEffect, useState } from "react";
import { cx } from "./styles/cx";
import { NonceContext } from "./nonce";

if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/serviceWorker.js");
  });
}

export const headers = () => {
  return {
    "Strict-Transport-Security": "max-age=31536000",
  };
};

export function Layout({ children }: { children: React.ReactNode }) {
  const nonce = useContext(NonceContext);
  const [scanlines, setScanlines] = useState(true);

  useEffect(() => {
    const f = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === "s") {
        setScanlines((prev) => !prev);
      }
    };
    window.addEventListener("keydown", f);

    return () => window.removeEventListener("keydown", f);
  }, []);

  return (
    <html lang="en" className={cx("h-full", scanlines ? "scanlines" : "")}>
      <head>
        <title>zaraz</title>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body className="mx-auto flex max-h-dvh max-w-screen-xl flex-col focus:[&_*]:outline-2 focus:[&_*]:outline-offset-8">
        {children}
        <ScrollRestoration nonce={nonce} />
        <Scripts nonce={nonce} />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}
