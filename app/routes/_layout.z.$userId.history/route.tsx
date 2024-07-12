import { LoaderFunctionArgs, defer, redirect } from "@remix-run/cloudflare";
import { Await, useLoaderData } from "@remix-run/react";
import { authenticate } from "~/utils/auth.server";
import { Table, Todo, camelCaseKeysFromSnakeCase } from "~/utils/db.server";
import { Suspense, useEffect, useState } from "react";
import { swr } from "~/utils/cache.server";
import { cx } from "~/styles/cx";
import {
  intlFormat,
  intlFormatDistance,
  startOfDay,
  startOfMonth,
} from "date-fns";

const getRecentTodos = async (db: D1Database, userId: string) => {
  const result = await db
    .prepare(
      `SELECT * FROM todos WHERE user_id = ? AND done = ? ORDER BY done_at DESC LIMIT 100`,
    )
    .bind(userId, true)
    .all<Table["todos"]>();

  return result.results.map(camelCaseKeysFromSnakeCase);
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

  const cacheKey = new Request(request.url, {
    headers: { "Cache-Control": "max-age=604800" },
    method: "GET",
  });
  const task = getRecentTodos(context.cloudflare.env.DB, userId);
  return defer({
    data: swr(context.cloudflare, task, { cacheKey, namespace: "todos" }),
    today: new Date().toISOString(),
  });
};

export default function Route() {
  const { data, today } = useLoaderData<typeof loader>();

  return (
    <main className="grow overflow-auto px-4 pb-20">
      <ul className="mt-10 flex flex-col gap-8">
        <Suspense fallback={null}>
          <Await resolve={data}>
            {(todos) => {
              const grouped = groupByMonth(todos);

              return grouped.map((todos) => {
                const day = new Date(todos[0].doneAt);
                return (
                  <li key={day.toDateString()}>
                    <ClientDate
                      className="text-2xl tracking-widest text-gray-500"
                      date={startOfDay(day)}
                    />
                    <ul className="space-y-1">
                      {todos.map((todo, i) => {
                        return (
                          <li key={todo.id} className="group">
                            <SmallRibbon
                              delay={i * 100}
                              className="group-odd:after:bg-green-200 group-even:after:bg-blue-200"
                            >
                              <dl>
                                <div>
                                  <dt className="sr-only">Done At</dt>
                                  <dd className="text-gray-600">
                                    <ClientTime
                                      date={new Date(todo.doneAt)}
                                      today={new Date(today)}
                                    />
                                  </dd>
                                </div>
                                <div>
                                  <dt className="sr-only">Label</dt>
                                  <dd className="text-2xl font-semibold text-black">
                                    {todo.name}
                                  </dd>
                                </div>
                              </dl>
                            </SmallRibbon>
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                );
              });
            }}
          </Await>
        </Suspense>
      </ul>
    </main>
  );
}

const groupByMonth = (todos: Todo[]) => {
  const groupedByMonth: Todo[][] = [];
  for (const todo of todos) {
    const doneAt = new Date(todo.doneAt);
    const month = startOfMonth(doneAt).getTime();
    const lastGroup = groupedByMonth[groupedByMonth.length - 1];
    if (
      lastGroup !== undefined &&
      startOfMonth(new Date(lastGroup[0].doneAt)).getTime() === month
    ) {
      lastGroup.push(todo);
    } else {
      groupedByMonth.push([todo]);
    }
  }
  return groupedByMonth;
};

type ClientDateProps = JSX.IntrinsicElements["time"] & {
  date: Date;
};

const ClientDate = ({ date, ...props }: ClientDateProps) => {
  const [appear, setAppear] = useState(true);

  useEffect(() => {
    setAppear(true);
  }, []);

  return (
    <time {...props} dateTime={date.toISOString()}>
      {appear
        ? intlFormat(
            date,
            { year: "numeric", month: "long" },
            { locale: "en-SV" },
          )
        : "-"}
    </time>
  );
};

type ClientTimeProps = JSX.IntrinsicElements["time"] & {
  date: Date;
  today: Date;
};

const ClientTime = ({ date, today, ...props }: ClientTimeProps) => {
  const [appear, setAppear] = useState(true);

  useEffect(() => {
    setAppear(true);
  }, []);

  return (
    <time
      {...props}
      title={
        appear
          ? intlFormat(
              date,
              { dateStyle: "long", timeStyle: "medium" },
              { locale: "en-SV" },
            )
          : date.toISOString()
      }
      dateTime={date.toISOString()}
    >
      {appear ? intlFormatDistance(date, today, { locale: "en-SV" }) : "-"}
    </time>
  );
};

type SmallRibbonProps = JSX.IntrinsicElements["div"] & { delay: number };

const SmallRibbon = ({ children, delay, ...props }: SmallRibbonProps) => {
  const [appear, setAppear] = useState(false);

  useEffect(() => {
    setAppear(true);
  }, []);

  return (
    <div
      {...props}
      className={cx(
        "relative flex grow text-balance px-10 py-2 text-black",
        "after:absolute after:inset-0 after:-z-10 group-odd:after:skew-x-6 group-even:after:-skew-x-6",
        "transition-all duration-300 ease-in-out",
        appear ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0",
        props.className,
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};
