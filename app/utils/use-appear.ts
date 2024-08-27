import { useEffect, useState } from "react";

export const useAppear = () => {
  const [appear, setAppear] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setAppear(true), 10);
    return () => {
      clearTimeout(timeout);
    };
  }, []);

  return appear;
};
