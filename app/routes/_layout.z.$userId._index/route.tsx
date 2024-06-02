import { LoaderFunctionArgs, defer, redirect } from "@remix-run/cloudflare";
import { Await, Form, Link, useLoaderData } from "@remix-run/react";
import { authenticate } from "~/utils/auth";
import { Table, camelCaseKeysFromSnakeCase } from "~/utils/db";
import ConfettiExplosion from "react-confetti-explosion";
import { cx } from "~/styles/cx";
import { Phonetic } from "~/components/Phonetic";
import { Subtitle } from "~/components/Subtitle";
import { Heading1 } from "~/components/Title";
import { Suspense, startTransition, useEffect, useState } from "react";
import { Button } from "~/components/Button";

const getTodos = async (db: D1Database, userId: string) => {
  const result = await db
    .prepare(
      `SELECT * FROM todos WHERE user_id = ? AND done = ? ORDER BY priority ASC`,
    )
    .bind(userId, false)
    .all<Table["todos"]>();

  return result.results.map(camelCaseKeysFromSnakeCase);
};

const getNumberOfDone = async (db: D1Database, userId: string) => {
  const result = await db
    .prepare(`SELECT COUNT(*) FROM todos WHERE user_id = ? AND done = ?`)
    .bind(userId, true)
    .first<{ "COUNT(*)": number }>();

  return result?.["COUNT(*)"] || 0;
};

const swr = async <T,>(
  cf: Cloudflare,
  task: Promise<T>,
  { request, namespace }: { request: Request; namespace: string },
) => {
  const cache = await cf.caches.open(namespace);

  const cacheKey = new Request(request.url, {
    headers: { "Cache-Control": "max-age=604800" },
    method: "GET",
  });
  const cached = await cache.match(cacheKey);

  const revalidate = async () => {
    const data = await task;
    const response = new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
    await cache.put(cacheKey, response);
  };

  cf.ctx.waitUntil(revalidate());

  if (cached) {
    return (await cached.json()) as Awaited<typeof task>;
  }

  return await task;
};

export const loader = async ({
  request,
  context,
  params: { userId },
}: LoaderFunctionArgs) => {
  const user = await authenticate(context.cloudflare, request);
  if (user.id !== userId) {
    throw redirect("/403");
  }

  const task = getTodos(context.cloudflare.env.DB, userId);
  return defer({
    data: await swr(context.cloudflare, task, { request, namespace: "todos" }),
    numberOfDone: getNumberOfDone(context.cloudflare.env.DB, userId),
  });
};

export default function Route() {
  const { data, numberOfDone } = useLoaderData<typeof loader>();
  const [todos, setTodos] = useState(data);
  const current = todos[0];

  const [explosion, setExplosion] = useState(0);

  return (
    <>
      <header className="flex">
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
      </header>
      <main>
        <Link
          to="add"
          className="px-2 text-blue-600 underline underline-offset-2 hover:bg-black hover:text-white"
        >
          Add new task
        </Link>
        <div
          key={current ? current.id : undefined}
          className="mb-10 mt-40 grid w-full grid-cols-2 gap-10 px-4 transition-opacity duration-300 ease-in-out"
        >
          <Ribbon
            className={cx("col-span-2", {
              "after:bg-green-300": !current,
              "after:bg-blue-300": current,
            })}
          >
            {current && (
              <span className="-my-4 inline-block bg-blue-400 shadow-xl">
                {current.name}
              </span>
            )}
            {!current && (
              <span className="-my-4 bg-green-400 shadow-xl">
                {"You're good!"}
              </span>
            )}
            {explosion !== 0 && <ConfettiExplosion />}
          </Ribbon>
          {current && (
            <Form
              method="POST"
              navigate={false}
              action="actions/soon"
              onSubmit={() => {
                setTodos((prev) => [...prev.slice(1), prev[0]]);
                setExplosion(0);
              }}
            >
              <input type="hidden" name="id" value={current.id} />
              <Button className="h-full border-orange-200 bg-orange-100">
                Soon
              </Button>
            </Form>
          )}
          {current && (
            <Form
              method="POST"
              navigate={false}
              action="actions/done"
              onSubmit={() => {
                setTodos((prev) => prev.slice(1));
                setExplosion((prev) => prev + 1);
              }}
            >
              <input type="hidden" name="id" value={current.id} />
              <Button className="h-full">Done</Button>
            </Form>
          )}
        </div>
        <div className="flex justify-center">
          <Suspense fallback={<></>}>
            <Await resolve={numberOfDone}>
              {(done) => {
                return (
                  <CountUp key={done} start={0} end={done}>
                    {(number) => {
                      const digits = number
                        .toString()
                        .padStart(5, "0")
                        .split("");

                      return (
                        <div
                          aria-label={`${done} done tasks`}
                          className="flex gap-1"
                        >
                          {digits.map((digit, i) => {
                            return (
                              <Tile
                                key={i}
                                role="presentation"
                                className={cx({
                                  "bg-yellow-200": digit === "0" && i === 0,
                                  "bg-red-200": digit === "0" && i === 1,
                                  "bg-pink-200": digit === "0" && i === 2,
                                  "bg-purple-200": digit === "0" && i === 3,
                                  "bg-green-200": digit === "0" && i === 4,
                                  "text-gray-600": digit === "0",
                                })}
                              >
                                {digit}
                              </Tile>
                            );
                          })}
                        </div>
                      );
                    }}
                  </CountUp>
                );
              }}
            </Await>
          </Suspense>
        </div>
      </main>
    </>
  );
}

type CountUpProps = {
  start: number;
  end: number;
  children: (number: number) => React.ReactNode;
};

const CountUp = ({ children, start, end }: CountUpProps) => {
  const [number, setNumber] = useState(start);

  useEffect(() => {
    if (number >= end) return;

    const frame = 300 / (end - start);

    const timeout = setTimeout(() => {
      startTransition(() => {
        setNumber((prev) => prev + 1);
      });
    }, frame);
    return () => {
      clearTimeout(timeout);
    };
  }, [end, number, start]);

  return children(number);
};

type TileProps = JSX.IntrinsicElements["div"] & {
  children: React.ReactNode;
};
const Tile = ({ children, ...props }: TileProps) => {
  return (
    <span
      {...props}
      role="presentation"
      className={cx(
        "rounded-md border-2 border-black bg-green-200 px-1 text-4xl transition-colors",
        props.className,
      )}
    >
      {children}
    </span>
  );
};

type RibbonProps = JSX.IntrinsicElements["p"];

const Ribbon = (props: RibbonProps) => {
  const [appear, setAppear] = useState(
    typeof window === "undefined" ? true : false,
  );

  useEffect(() => {
    setAppear(true);
  }, []);

  return (
    <p
      {...props}
      className={cx(
        "relative flex grow justify-center text-balance px-10 py-2 text-center text-5xl font-bold text-black decoration-wavy underline-offset-2 md:text-6xl lg:mb-0 lg:text-7xl xl:text-8xl",
        "after:absolute after:inset-0 after:-z-10 after:-skew-x-6",
        "transition-all duration-300 ease-in-out",
        appear ? "translate-y-0" : "-translate-y-2",
        props.className,
      )}
    />
  );
};
