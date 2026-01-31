import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { ENV } from "./env";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

// Mock user for development when OAuth is not configured
const DEV_MOCK_USER: User = {
  id: 1,
  openId: "dev-user",
  name: "Development User",
  email: "dev@localhost",
  loginMethod: "dev",
  role: "super_admin",
  linkedClientId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  // If OAuth is not configured, use mock user in development
  if (!ENV.oAuthServerUrl && process.env.NODE_ENV === "development") {
    user = DEV_MOCK_USER;
  } else {
    try {
      user = await sdk.authenticateRequest(opts.req);
    } catch (error) {
      // Authentication is optional for public procedures.
      user = null;
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
