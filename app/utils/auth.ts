import { createCookie, redirect } from "@remix-run/cloudflare";
import { type } from "arktype";
import { jwtDecode } from "jwt-decode";

const parseAuth = type({
  access_token: "string",
  expires_in: "number",
  token_type: "'Bearer'",
  scope: "string",
  id_token: "string",
});

const parseUser = type({
  id: "string",
  email: "string",
});

type User = (typeof parseUser)["infer"];

const createUserCookie = (cf: Cloudflare) => {
  return createCookie("user", {
    path: "/",
    sameSite: "lax",
    httpOnly: true,
    secure: true,
    secrets: [cf.env.AUTH_SECRET],
  });
};

export const serializeUserCookie = (cf: Cloudflare, value: User) => {
  return createUserCookie(cf).serialize(value, {
    expires: new Date(Date.now() + 86400_000),
    maxAge: 86400,
  });
};

const parseUserCookie = async (cf: Cloudflare, request: Request) => {
  const value = await createUserCookie(cf).parse(request.headers.get("Cookie"));

  const { data, problems } = parseUser(value);
  if (problems) {
    console.log(problems.summary);
    return undefined;
  }

  return data;
};

export class failure<const MESSAGE extends string> extends Error {
  response: Response;
  message: MESSAGE;

  constructor(
    message: MESSAGE,
    options: ConstructorParameters<typeof Response>[1],
  ) {
    super(message);
    this.message = message;
    this.response = new Response(message, options);
  }
}

type CreateAuthResponseConfig = {
  clientId: string;
  redirectUrl: string;
  state: string;
};

const createAuthResponse = ({
  clientId,
  redirectUrl,
  state,
}: CreateAuthResponseConfig) => {
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUrl);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("access_type", "online");
  url.searchParams.set("state", state);
  url.searchParams.set(
    "scope",
    "https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile openid",
  );

  return redirect(url.href, 302);
};

type CreateExchangeRequestConfig = {
  clientId: string;
  clientSecret: string;
  redirectUrl: string;
  code: string;
};

const createExchangeRequest = ({
  clientId,
  clientSecret,
  redirectUrl,
  code,
}: CreateExchangeRequestConfig) => {
  const url = new URL("https://oauth2.googleapis.com/token");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("client_secret", clientSecret);
  url.searchParams.set("code", code);
  url.searchParams.set("redirect_uri", redirectUrl);
  url.searchParams.set("grant_type", "authorization_code");

  return new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
};

export const putReturnResponse = async (
  cf: Cloudflare,
  state: string,
  url: URL,
) => {
  const cache = await cf.caches.open("redirect");
  cache.put(new Request(new URL(`/${state}`, url.origin)), redirect(url.href));
};

export const findReturnResponse = async (cf: Cloudflare, url: URL) => {
  const cache = await cf.caches.open("redirect");
  const key = new URL(`/${url.searchParams.get("state")}`, url.origin);
  return (await cache.match(key)) as Response | undefined;
};

export const exchangeCode = async (cf: Cloudflare, url: URL) => {
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (code === null) {
    return new failure("missing_code", { status: 422 });
  }

  if (error !== null) {
    return new failure(`oauth_${error}`, { status: 422 });
  }

  const request = createExchangeRequest({
    clientId: cf.env.CLIENT_ID,
    clientSecret: cf.env.CLIENT_SECRET,
    redirectUrl: new URL("/callback", url.origin).href,
    code,
  });

  const response = await fetch(request);
  if (!response.ok) {
    return new failure("exchange_failed", { status: 500 });
  }

  const json = await response.json();

  const { data, problems } = parseAuth(json);
  if (problems) {
    return new failure("unrecognized_token", { status: 500 });
  }

  const token = jwtDecode(data.id_token);

  if (!("email" in token) || !("email_verified" in token)) {
    return new failure("missing_fields", { status: 422 });
  }

  if (!token.sub) {
    return new failure("missing_sub", { status: 422 });
  }

  if (!token.email || typeof token.email !== "string") {
    return new failure("missing_email", { status: 422 });
  }

  if (token.email_verified !== true) {
    return new failure("email_not_verified", { status: 422 });
  }

  return { id: token.sub, email: token.email } satisfies User;
};

export const authenticate = async (cf: Cloudflare, request: Request) => {
  const user = await parseUserCookie(cf, request);
  if (!user) {
    const state = crypto.randomUUID();
    const url = new URL(request.url);

    await putReturnResponse(cf, state, url);

    throw createAuthResponse({
      clientId: cf.env.CLIENT_ID,
      redirectUrl: new URL("/callback", url.origin).href,
      state,
    });
  }

  return user;
};

export const logout = async (cf: Cloudflare, path: string) => {
  const cookie = createUserCookie(cf);

  return redirect(path, {
    headers: {
      "Set-Cookie": await cookie.serialize("", { expires: new Date(0) }),
      "Clear-Site-Data": "cookies",
    },
  });
};
