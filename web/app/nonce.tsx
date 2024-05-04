import { createContext } from "react";

// https://github.com/remix-run/remix/issues/5162#issuecomment-1400748264
export const NonceContext = createContext<string | undefined>(undefined);
