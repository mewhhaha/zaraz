import { Link } from "@remix-run/react";
import { Phonetic } from "~/components/Phonetic";
import { Subtitle } from "~/components/Subtitle";
import { Heading1 } from "~/components/Title";
import { cx } from "~/styles/cx";

export default function Route() {
  return (
    <>
      <header>
        <hgroup className="p-1">
          <Heading1 aria-describedby="desription">
            zaraz
            <Phonetic> /zaras/</Phonetic>
          </Heading1>
          <Subtitle id="description">
            {"Zaraz to zrobię, I'll do it in a moment"}
          </Subtitle>
        </hgroup>
      </header>
      <main className="my-40 flex w-full justify-center px-4 sm:px-10">
        <Link
          to="/auth"
          className={cx(
            "relative px-10 text-3xl font-bold text-blue-900 decoration-wavy underline-offset-2 hover:text-blue-700 hover:underline focus:text-blue-700 focus:underline  sm:text-4xl md:text-5xl lg:text-6xl xl:text-8xl",
            "after:absolute after:inset-0 after:-z-10 after:-skew-x-6 after:bg-blue-300",
          )}
        >
          Authenticate
        </Link>
      </main>
    </>
  );
}
