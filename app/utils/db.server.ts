export type Table = {
  users: {
    id: string;
    oauth_id: string;
    created_at: string;
    updated_at: string;
    email: string;
    provider: string;
    name: string;
  };

  todos: {
    id: string;
    priority: number;
    done: boolean;
    done_at: string;
    created_at: string;
    updated_at: string;
    user_id: string;
    name: string;
  };
};

type LowerCaseLetter =
  | "a"
  | "b"
  | "c"
  | "d"
  | "e"
  | "f"
  | "g"
  | "h"
  | "i"
  | "j"
  | "k"
  | "l"
  | "m"
  | "n"
  | "o"
  | "p"
  | "q"
  | "r"
  | "s"
  | "t"
  | "u"
  | "v"
  | "w"
  | "x"
  | "y"
  | "z";

export type Todo = {
  [K in keyof Table["todos"] as CamelCaseFromSnakeCase<K>]: Table["todos"][K];
};

type CamelCaseFromSnakeCase<T extends string> =
  T extends `${infer pre}_${infer letter extends LowerCaseLetter}${infer post}`
    ? `${pre}${Uppercase<letter>}${CamelCaseFromSnakeCase<post>}`
    : T;

export function camelCaseKeysFromSnakeCase<T extends Record<string, unknown>>(
  record: T,
): { [K in keyof T as CamelCaseFromSnakeCase<K & string>]: T[K] };
export function camelCaseKeysFromSnakeCase(record: Record<string, unknown>) {
  const result: Record<string, unknown> = {};
  const camelCaseFromSnakeCase = (key: string) => {
    return key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  };

  for (const key in record) {
    const value = record[key];

    result[camelCaseFromSnakeCase(key)] = value;
  }
  return result;
}
