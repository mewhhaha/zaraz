import { cx } from "~/styles/cx";

type PhoneticProps = JSX.IntrinsicElements["span"];

export const Phonetic = (props: PhoneticProps) => {
  return (
    <span {...props} className={cx("text-xl font-thin", props.className)} />
  );
};
