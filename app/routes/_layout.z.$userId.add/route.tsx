import { Form, redirect } from "@remix-run/react";
import { cx } from "~/styles/cx";
import { useEffect, useRef, useState } from "react";
import { Button } from "~/components/Button";
import { LoaderFunctionArgs } from "@remix-run/cloudflare";
import { authenticate } from "~/utils/auth.server";

export const loader = async ({
  request,
  context,
  params: { userId },
}: LoaderFunctionArgs) => {
  const user = await authenticate(context.cloudflare, request);
  if (user.id !== userId) {
    throw redirect("/403");
  }
  return null;
};

export const clientLoader = async () => {
  return null;
};

export default function Route() {
  const [recent, setRecent] = useState<string[]>([]);

  const handleOnSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const target = event.currentTarget;
    const formData = new FormData(target);
    const name = formData.get("name")?.toString();
    if (!name) {
      throw new Error("Name is required");
    }

    setRecent((prev) => {
      return [name, ...prev];
    });

    target.reset();
  };

  return (
    <main>
      <Form
        method="POST"
        action="./../actions/add"
        navigate={false}
        onSubmit={handleOnSubmit}
        className="mb-10 mt-40 grid w-full grid-cols-2 gap-10 px-4"
      >
        <div
          className={cx(
            "relative col-span-2 flex grow px-10 font-bold text-black decoration-wavy underline-offset-2",
            "min-w-0 after:absolute after:inset-0 after:-z-10 after:-skew-x-6 after:bg-blue-300",
          )}
        >
          <AutoTextArea
            required
            rows={1}
            placeholder="?"
            name="name"
            className="-my-4 w-full min-w-0 grow border-4 border-black bg-blue-400 px-4 text-center text-5xl shadow-xl selection:bg-black selection:text-white placeholder:text-white focus:border-blue-500 md:text-6xl lg:text-7xl xl:text-8xl"
          />
        </div>
        <div className="col-span-2 flex">
          <Button className="mx-auto w-full max-w-screen-md flex-none border-blue-200 bg-blue-100">
            {"I'll do it in a moment"}
          </Button>
        </div>
      </Form>
      <ul>
        {recent.map((name, index) => (
          <li key={index}>
            <RecentItem>
              <span className="-my-4 bg-blue-400">{name}</span>
            </RecentItem>
          </li>
        ))}
      </ul>
    </main>
  );
}

type RecentItemProps = JSX.IntrinsicElements["p"];

const RecentItem = (props: RecentItemProps) => {
  return (
    <p
      {...props}
      className={cx(
        "relative break-all px-10 py-2 text-xl font-bold text-black decoration-wavy underline-offset-2 [grid-area:1/span_2] lg:mb-0",
        "after:absolute after:inset-0 after:-z-10 after:-skew-x-6",
        props.className,
      )}
    />
  );
};

type AutoTextAreaProps = JSX.IntrinsicElements["textarea"];

const AutoTextArea = (props: AutoTextAreaProps) => {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [state, setState] = useState(props.defaultValue);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const form = el.closest("form");
    if (!form) return;

    const handleReset = () => {
      setState(props.defaultValue);
    };
    form.addEventListener("reset", handleReset);

    return () => {
      form.removeEventListener("reset", handleReset);
    };
  });

  return (
    <div className="grid grow">
      <textarea
        ref={ref}
        {...props}
        onChange={(event) => {
          setState(event.currentTarget.value);
          props.onChange?.(event);
        }}
        onReset={(event) => {
          setState(props.defaultValue);
          props.onReset?.(event);
        }}
        className={cx(
          "resize-none overflow-hidden whitespace-pre-wrap [grid-area:1/1/2/2]",
          props.className,
        )}
      />

      <div
        role="presentation"
        style={props.style}
        className={cx(
          "invisible overflow-hidden whitespace-pre-wrap break-all pb-2 [grid-area:1/1/2/2]",
          props.className,
        )}
      >
        {state}
        <span>{/** extra space for valid newlines */} </span>
      </div>
    </div>
  );
};
