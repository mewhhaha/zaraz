import { LoaderFunctionArgs } from "@remix-run/cloudflare";
import { Form, Link } from "@remix-run/react";
import { authenticate } from "~/utils/auth";

import { cx } from "~/styles/cx";
import { Phonetic } from "~/components/Phonetic";
import { Subtitle } from "~/components/Subtitle";
import { Heading1 } from "~/components/Title";
import { useState } from "react";
import { Button } from "~/components/Button";

export const loader = async ({ request, context }: LoaderFunctionArgs) => {
  await authenticate(context.cloudflare, request);
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
    setTimeout(() => {
      target.reset();
    });
  };

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
          to="../"
          className="px-2 text-blue-600 underline underline-offset-2 hover:bg-black hover:text-white"
        >
          Go back to list
        </Link>

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
            <TextArea
              required
              rows={1}
              placeholder="?"
              name="name"
              defaultValue=""
              className="-my-4 w-full min-w-0 grow border-4 border-black bg-blue-400 px-4 text-center text-5xl shadow-xl selection:bg-black selection:text-white placeholder:text-white focus:border-blue-500 md:text-6xl lg:text-7xl xl:text-8xl"
            />
          </div>
          <div className="col-span-2 flex">
            <Button
              name="position"
              value="bottom"
              className="mx-auto w-full max-w-screen-md flex-none border-blue-200 bg-blue-100"
            >
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
    </>
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

type TextAreaProps = JSX.IntrinsicElements["textarea"];

const TextArea = (props: TextAreaProps) => {
  const [state, setState] = useState(props.defaultValue);
  return (
    <div className="grid grow">
      <textarea
        {...props}
        onChange={(event) => {
          setState(event.currentTarget.value);
          props.onChange?.(event);
        }}
        onReset={() => {
          setState(props.defaultValue);
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
