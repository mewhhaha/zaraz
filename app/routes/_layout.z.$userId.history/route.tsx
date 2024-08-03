import { LoaderFunctionArgs, defer, redirect } from "@remix-run/cloudflare";
import { Await, Form, useLoaderData } from "@remix-run/react";
import { authenticate } from "~/utils/auth.server";
import { Table, Todo, camelCaseKeysFromSnakeCase } from "~/utils/db.server";
import {
  MouseEvent,
  Suspense,
  SyntheticEvent,
  useEffect,
  useState,
} from "react";
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
  const [removed, setRemoved] = useState<string[]>([]);

  return (
    <main className="relative grow overflow-auto px-4 pb-20 pt-28">
      <ul className="flex flex-col gap-20">
        <AwaitHistory today={today} resolve={data}>
          {(todos) => {
            const grouped = groupByMonth(todos);

            return grouped.map((todos) => {
              const day = new Date(todos[0].doneAt);
              return (
                <li key={day.toDateString()}>
                  <div className="sticky -top-28 z-10 w-full border-b border-green-500 bg-white py-2">
                    <ClientMonth
                      className="sticky top-0 text-2xl tracking-widest text-gray-900"
                      date={startOfDay(day)}
                    />
                  </div>
                  <ul className="space-y-1 rounded-b-xl bg-green-100 px-4 py-2 sm:px-10">
                    {todos.map((todo, i) => {
                      const removing = removed.includes(todo.id);
                      const handleOnRemove = (
                        event: MouseEvent<HTMLButtonElement>,
                      ) => {
                        event.currentTarget.form?.requestSubmit();
                        setRemoved((removed) => [...removed, todo.id]);
                      };

                      return (
                        <li
                          key={todo.id}
                          className={cx("group", removing ? "opacity-50" : "")}
                        >
                          <SmallRibbon
                            delay={i * 100}
                            className="group-odd:after:bg-green-200 group-even:after:bg-blue-200"
                          >
                            <TodoDone
                              doneAt={todo.doneAt}
                              today={today}
                              actions={
                                <FormDeleteTodo todoId={todo.id}>
                                  <button
                                    disabled={removing}
                                    className="rounded border border-transparent px-4 py-1 font-semibold text-red-800 hover:border hover:border-red-200 hover:bg-red-600 hover:text-white"
                                    onClick={onConfirm(
                                      `Are you sure you want to remove "${todo.name}"?`,
                                      handleOnRemove,
                                    )}
                                  >
                                    Remove
                                  </button>
                                </FormDeleteTodo>
                              }
                            >
                              {todo.name}
                            </TodoDone>
                          </SmallRibbon>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              );
            });
          }}
        </AwaitHistory>
      </ul>
    </main>
  );
}

type TodoDoneProps = {
  today: string;
  doneAt: string;
  actions: React.ReactNode;
  children: React.ReactNode;
};
const TodoDone = ({ doneAt, today, children, actions }: TodoDoneProps) => {
  return (
    <dl>
      <div className="flex items-center justify-between">
        <dt className="sr-only">Done At</dt>
        <dd className="text-gray-600">
          <ClientTime date={new Date(doneAt)} today={new Date(today)} />
        </dd>
        {actions}
      </div>
      <div>
        <dt className="sr-only">Label</dt>
        <dd className="text-2xl font-semibold text-black">{children}</dd>
      </div>
    </dl>
  );
};

type AwaitHistoryProps = {
  today: string;
  resolve: Promise<Todo[]>;
  children: (todos: Todo[]) => React.ReactNode;
};

const AwaitHistory = ({ children, today, resolve }: AwaitHistoryProps) => {
  return (
    <Suspense
      fallback={
        <li>
          <ClientMonth
            className="text-2xl tracking-widest text-gray-900"
            date={startOfDay(new Date(today))}
          />
          <ul className="animate-pulse space-y-1 bg-gray-100 px-10 py-2">
            {new Array(10).fill(
              <SmallRibbon delay={0} transition={false}>
                {" "}
              </SmallRibbon>,
            )}
          </ul>
        </li>
      }
    >
      <Await resolve={resolve}>{children}</Await>
    </Suspense>
  );
};

type FormDeleteTodoProps = {
  todoId: string;
  children: React.ReactNode;
};

const FormDeleteTodo = ({ todoId, children }: FormDeleteTodoProps) => {
  return (
    <Form method="DELETE" action="../actions/remove" navigate={false}>
      <input type="hidden" name="id" value={todoId} />
      {children}
    </Form>
  );
};

const onConfirm =
  <T extends SyntheticEvent>(message: string, f: (event: T) => void) =>
  (event: T) => {
    event.preventDefault();
    const answer = window.confirm(message);
    if (answer) {
      f(event);
    }
  };

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

type ClientMonthProps = JSX.IntrinsicElements["time"] & {
  date: Date;
};

const ClientMonth = ({ date, ...props }: ClientMonthProps) => {
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

type SmallRibbonProps = JSX.IntrinsicElements["div"] & {
  delay: number;
  transition?: boolean;
};

const SmallRibbon = ({
  children,
  delay,
  transition = true,
  ...props
}: SmallRibbonProps) => {
  const [appear, setAppear] = useState(false);

  useEffect(() => {
    setAppear(true);
  }, []);

  return (
    <div
      {...props}
      className={cx(
        "bg-green-200 px-4 pb-2 pt-1 duration-300 ease-in-out group-first:rounded-t-xl group-last:rounded-b-xl sm:px-10",
        appear ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0",
        transition ? "transition-all" : "transition-none",
        props.className,
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};
