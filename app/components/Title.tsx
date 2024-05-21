import { cx } from "~/styles/cx";

type Heading1Props = JSX.IntrinsicElements["h1"];

export const Heading1 = (props: Heading1Props) => {
  return (
    <h1 {...props} className={cx("text-6xl font-medium", props.className)}>
      {props.children}
    </h1>
  );
};
