import { cx } from "~/styles/cx";

type SubtitleProps = JSX.IntrinsicElements["p"];

export const Subtitle = (props: SubtitleProps) => {
  return (
    <p
      {...props}
      className={cx("ml-1 text-lg font-thin italic", props.className)}
    />
  );
};
