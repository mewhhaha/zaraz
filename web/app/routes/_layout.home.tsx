import { ActionFunctionArgs } from "@remix-run/cloudflare";
import { Form, useLoaderData } from "@remix-run/react";
import { ArkErrors, type } from "arktype";
import { useEffect, useState } from "react";
import { cx } from "~/styles/cx";

const generateTodo = (data: { name: string; order: number }) => {
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const updatedAt = createdAt;

  return {
    ...data,
    id,
    description: "",
    createdAt,
    updatedAt,
    doneAt: undefined,
    done: false,
  };
};

const addTodo = type({
  name: "string",
});

type Todo = {
  id: string;
  order: number;
  createdAt: string;
  updatedAt: string;
  doneAt?: string;
  done: boolean;
  name: string;
  description: string;
};

const todos: Todo[] = [
  generateTodo({ name: "test", order: 0 }),
  generateTodo({ name: "test2", order: 1 }),
];

export const loader = () => {
  return todos.toReversed();
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const data = addTodo(Object.fromEntries([...formData.entries()]));
  if (data instanceof ArkErrors) {
    return { summary: data.summary };
  }

  todos.push(generateTodo({ ...data, order: todos.length }));

  return null;
};

export default function Page() {
  const todos = useLoaderData<typeof loader>();

  return (
    <main className="mx-auto mt-10 flex min-h-40 max-w-md flex-col gap-4 border bg-white p-2">
      <Form method="POST" className="flex flex-col gap-4">
        <Input
          name="name"
          type="text"
          required
          minLength={2}
          maxLength={60}
          autoComplete="off"
          placeholder="What do you need to do?"
          className="w-full"
        />
        <Button>Add todo</Button>
      </Form>
      <hr />
      <Listbox className="group space-y-2" aria-label="Todo list">
        {(current) =>
          todos.map((todo, i) => {
            const selected = current === i;

            return (
              <li
                role="option"
                aria-selected={selected}
                key={todo.id}
                className="flex items-center overflow-hidden border border-black p-2 aria-selected:bg-blue-100 aria-selected:group-focus-within:bg-blue-200"
              >
                <div className="mr-2 flex-none">
                  <Checkbox
                    tabIndex={selected ? 0 : -1}
                    defaultChecked={todo.done}
                  />
                </div>
                <TodoItem
                  title={todo.name}
                  selected={selected}
                  createdAt={new Date(todo.createdAt)}
                  updatedAt={new Date(todo.updatedAt)}
                  doneAt={
                    typeof todo.doneAt === "string"
                      ? new Date(todo.doneAt)
                      : undefined
                  }
                >
                  {todo.description}
                </TodoItem>
              </li>
            );
          })
        }
      </Listbox>
    </main>
  );
}

type ListboxProps = Omit<JSX.IntrinsicElements["ul"], "children"> & {
  children: (selected: number) => React.ReactNode;
};

const Listbox = ({ children, ...props }: ListboxProps) => {
  const [selected, setSelected] = useState(0);

  return (
    <ul
      {...props}
      role="listbox"
      tabIndex={0}
      onKeyDown={(event) => {
        const length = event.currentTarget.children.length;

        const isOutOfBounds = (index: number) => {
          return index < 0 || index >= length;
        };

        if (event.key === "ArrowDown") {
          setSelected((selected) => {
            const next = selected + 1;
            return isOutOfBounds(next) ? 0 : next;
          });
          event.currentTarget.focus();
        }

        if (event.key === "ArrowUp") {
          setSelected((selected) => {
            const prev = selected - 1;
            return isOutOfBounds(prev) ? length - 1 : prev;
          });
          event.currentTarget.focus();
        }
      }}
    >
      {children(selected)}
    </ul>
  );
};

type TodoItemProps = {
  title: React.ReactNode;
  createdAt: Date;
  updatedAt: Date;
  doneAt?: Date;
  selected: boolean;
  children: React.ReactNode;
};

const TodoItem = ({
  title,
  selected,
  createdAt,
  updatedAt,
  doneAt,
  children,
}: TodoItemProps) => {
  return (
    <article className="flex justify-between">
      <h1 className="text-xl font-bold tracking-widest">{title}</h1>
      {/* <Details summary="Details">
        <dl className="space-y-2 bg-teal-200 px-2 pb-2">
          <DescriptionItem>
            <dt>created at</dt>
            <dd>{createdAt}</dd>
          </DescriptionItem>
          <DescriptionItem>
            <dt>updated at</dt>
            <dd>{updatedAt}</dd>
          </DescriptionItem>
        </dl>
      </Details> */}
      <p>{children}</p>
    </article>
  );
};

const Checkbox = (
  props: JSX.IntrinsicElements["input"] & { defaultChecked: boolean },
) => {
  return (
    <>
      <label>
        <input
          {...props}
          type="checkbox"
          className={cx(
            "relative m-auto block size-5 cursor-pointer appearance-none text-center",
            "before:absolute before:block before:size-5 before:rounded-sm before:border-2 before:border-black before:content-['']",
            "hover:before:bg-[#FFC29F] hover:before:shadow-brutalist",
            "focus:before:bg-[#FFC29F] focus:before:shadow-brutalist",
            "checked:before:bg-[#FF965B] checked:before:shadow-brutalist checked:after:opacity-100",
            "after:absolute after:left-1.5 after:top-0.5 after:block after:h-3 after:w-2 after:origin-center after:rotate-45 after:border-b-2 after:border-r-2 after:border-black after:opacity-0 after:content-['']",
          )}
        />
      </label>
    </>
  );
};

// type DetailsProps = {
//   summary: React.ReactNode;
//   children: React.ReactNode;
// };

// const Details = ({ summary, children }: DetailsProps) => {
//   return (
//     <details
//       className={cx(
//         "border-2 border-black",
//         "hover:bg-teal-200 hover:shadow-brutalist",
//         "focus-within:shadow-brutalist",
//         "open:shadow-brutalist",
//       )}
//     >
//       <summary className="px-2 py-1 hover:cursor-pointer focus:outline-none">
//         <span className="ml-1 inline-block">{summary}</span>
//       </summary>
//       {children}
//     </details>
//   );
// };

// type DescriptionItemProps = {
//   children: React.ReactNode;
// };

// const DescriptionItem = ({ children }: DescriptionItemProps) => {
//   return (
//     <div className="[&_dd]:font-bold [&_dt]:text-gray-800">{children}</div>
//   );
// };

const Button = (props: JSX.IntrinsicElements["button"]) => {
  return (
    <button
      {...props}
      className={cx(
        "h-12 rounded-full border-2 border-black p-2.5 active:bg-[#00E1EF]",
        "hover:bg-yellow-200 hover:shadow-brutalist",
        "focus:bg-yellow-200 focus:shadow-brutalist",
        props.className,
      )}
    />
  );
};

const Input = (props: JSX.IntrinsicElements["input"]) => {
  return (
    <input
      {...props}
      className={cx(
        "border-2 border-black p-2.5 valid:bg-rose-300 active:shadow-brutalist",
        "focus:bg-rose-200 focus:shadow-brutalist",
        props.className,
      )}
    />
  );
};
