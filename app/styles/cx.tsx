import clsx from "clsx";
import { twMerge } from "tailwind-merge";

export const cx = (...args: Parameters<typeof clsx>) => twMerge(clsx(...args));
