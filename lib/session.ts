import { getIronSession, IronSession, IronSessionData } from "iron-session";
import { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";

export const sessionOptions = {
  password: process.env.SECRET_COOKIE_PASSWORD as string,
  cookieName: "ocr-learning-app-session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
  },
};

export async function getSession(cookies: ReadonlyRequestCookies): Promise<IronSession<IronSessionData>> {
  const session = await getIronSession(cookies, sessionOptions);
  return session;
}
