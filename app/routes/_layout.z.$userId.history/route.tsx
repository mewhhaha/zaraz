import { LoaderFunctionArgs, defer, redirect } from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";
import { authenticate } from "~/utils/auth";
import { Table, camelCaseKeysFromSnakeCase } from "~/utils/db";
import { useEffect, useState } from "react";
import { swr } from "~/utils/cache";
import { cx } from "~/styles/cx";
import { intlFormat, intlFormatDistance } from "date-fns";

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
    data: await swr(context.cloudflare, task, { cacheKey, namespace: "todos" }),
  });
};

export default function Route() {
  const { data } = useLoaderData<typeof loader>();

  return (
    <main className="overflow-auto px-4">
      <ul className="mt-10 flex flex-col gap-8">
        {data.map((todo) => {
          return (
            <li key={todo.id} className="group">
              <SmallRibbon className="group-odd:after:bg-green-200 group-even:after:bg-green-700">
                <dl>
                  <div>
                    <dt className="sr-only">Done At</dt>
                    <dd className="text-start text-lg font-normal group-odd:text-gray-800 group-even:text-gray-200">
                      Done <ClientDate value={new Date(todo.doneAt)} />
                    </dd>
                  </div>
                  <div>
                    <dt className="sr-only">Label</dt>
                    <dd className="text-start text-2xl group-odd:text-black group-even:text-gray-100">
                      {todo.name}
                    </dd>
                  </div>
                </dl>
              </SmallRibbon>
            </li>
          );
        })}
      </ul>
    </main>
  );
}

type ClientDateProps = {
  value: Date;
};

const ClientDate = ({ value }: ClientDateProps) => {
  const [appear, setAppear] = useState(false);

  useEffect(() => {
    setAppear(true);
  }, [value]);

  return (
    <time
      title={
        appear
          ? intlFormat(
              value,
              { dateStyle: "long", timeStyle: "medium" },
              { locale: "en-SV" },
            )
          : value.toISOString()
      }
      dateTime={value.toISOString()}
    >
      {appear
        ? intlFormatDistance(value, new Date(), { locale: "en-SV" })
        : "-"}
    </time>
  );
};

type SmallRibbonProps = JSX.IntrinsicElements["p"];

const SmallRibbon = (props: SmallRibbonProps) => {
  const [appear, setAppear] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setAppear(true);
    }
  }, []);

  return (
    <p
      {...props}
      className={cx(
        "relative flex grow text-balance px-10 py-2 text-center font-bold text-black decoration-wavy underline-offset-2 lg:mb-0",
        "after:absolute after:inset-0 after:-z-10 after:-skew-x-6",
        "transition-all duration-300 ease-in-out",
        appear ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0",
        props.className,
      )}
    />
  );
};
