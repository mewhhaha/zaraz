import { LoaderFunctionArgs, defer, redirect } from "@remix-run/cloudflare";
import {
  Await,
  ClientLoaderFunctionArgs,
  Form,
  useLoaderData,
} from "@remix-run/react";
import { authenticate } from "~/utils/auth.server";
import { Table, Todo, camelCaseKeysFromSnakeCase } from "~/utils/db.server";
import ConfettiExplosion from "react-confetti-explosion";
import { cx } from "~/styles/cx";
import {
  ReactNode,
  Suspense,
  startTransition,
  useEffect,
  useState,
} from "react";
import { Button } from "~/components/Button";
import { useAppear } from "~/utils/use-appear";

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

export const loader = async ({
  request,
  context,
  params: { userId },
}: LoaderFunctionArgs) => {
  const user = await authenticate(context.cloudflare, request);
  if (user.id !== userId) {
    throw redirect("/403");
  }

  return defer({
    data: getTodos(context.cloudflare.env.DB, userId),
    numberOfDone: getNumberOfDone(context.cloudflare.env.DB, userId),
  });
};

export const clientLoader = async ({
  serverLoader,
}: ClientLoaderFunctionArgs) => {
  const data = serverLoader<typeof loader>();
  return {
    data: data.then((x) => x.data),
    numberOfDone: data.then((x) => x.numberOfDone),
  };
};

export default function Route() {
  const { data, numberOfDone } = useLoaderData<typeof loader>();
  return (
    <main>
      <Suspense
        fallback={
          <div className="animate-pulse">
            <div className="mb-10 mt-40 grid w-full grid-cols-2 gap-10 px-4 transition-opacity duration-300 ease-in-out">
              <Ribbon
                animate={false}
                className={cx("col-span-3 after:bg-gray-300")}
              >
                <span className="-my-4 bg-gray-400 shadow-xl">{"..."}</span>
              </Ribbon>

              <Button disabled className="h-full">
                Soon
              </Button>
              <Button disabled className="h-full">
                Done
              </Button>
            </div>
          </div>
        }
      >
        <Await resolve={data}>
          {(todos) => {
            return <TodoArea todos={todos} />;
          }}
        </Await>
      </Suspense>

      <div className="flex justify-center">
        <Suspense
          fallback={
            <div className="animate-pulse">
              <TodoScore count={0}>{`unknown done tasks`}</TodoScore>
            </div>
          }
        >
          <Await resolve={numberOfDone}>
            {(done) => {
              return (
                <CountUp key={done} start={0} end={done}>
                  {(number) => {
                    return (
                      <TodoScore
                        count={number}
                      >{`${done} done tasks`}</TodoScore>
                    );
                  }}
                </CountUp>
              );
            }}
          </Await>
        </Suspense>
      </div>
    </main>
  );
}

type TodoScoreProps = {
  count: number;
  children: ReactNode;
};
const TodoScore = ({ count, children }: TodoScoreProps) => {
  const digits = count.toString().padStart(5, "0").split("");

  return (
    <div className="flex gap-1">
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
      <span className="sr-only">{children}</span>
    </div>
  );
};

type TodoAreaProps = {
  todos: Todo[];
};
const TodoArea = ({ todos: data }: TodoAreaProps) => {
  const [todos, setTodos] = useState(data);
  const current = todos[0];

  const [explosion, setExplosion] = useState(-1);

  return (
    <div
      key={current ? current.id : undefined}
      className="mb-10 mt-40 grid w-full grid-cols-2 gap-10 px-4 transition-opacity duration-300 ease-in-out"
    >
      <Ribbon
        className={cx("col-span-3", {
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
          <span className="-my-4 bg-green-400 shadow-xl">{"You're good!"}</span>
        )}
        {explosion !== -1 && <ConfettiExplosion />}
      </Ribbon>
      {current && (
        <Form
          method="POST"
          navigate={false}
          action="./../actions/soon"
          onSubmit={() => {
            setTodos((prev) => [...prev.slice(1), prev[0]]);
            setExplosion(-1);
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
          action="./../actions/done"
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
  );
};

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

type RibbonProps = JSX.IntrinsicElements["p"] & { animate?: boolean };

const Ribbon = ({ animate = true, ...props }: RibbonProps) => {
  const appear = useAppear();

  return (
    <p
      {...props}
      className={cx(
        "relative flex grow justify-center text-balance px-10 py-2 text-center text-5xl font-bold text-black decoration-wavy underline-offset-2 md:text-6xl lg:mb-0 lg:text-7xl xl:text-8xl",
        "after:absolute after:inset-0 after:-z-10 after:-skew-x-6",
        "transition-[transform,opacity,max-height] duration-300 ease-in-out",
        "origin-top",
        appear || !animate
          ? "max-h-96 translate-y-0 skew-y-0 scale-y-100 opacity-100"
          : "max-h-0 -translate-y-10 skew-y-12 scale-y-0 opacity-0",
        props.className,
      )}
    />
  );
};
