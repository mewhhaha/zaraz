import { cx } from "~/styles/cx";

type ButtonProps = JSX.IntrinsicElements["button"];

export const Button = (props: ButtonProps) => {
  return (
    <button
      {...props}
      className={cx(
        "min-h-12 w-full rounded-full border-4 border-green-200 bg-green-100 px-4 py-2 text-2xl font-semibold tracking-widest text-black decoration-wavy hover:border-gray-700 hover:bg-black hover:text-white hover:underline",
        props.className,
      )}
    />
  );
};
