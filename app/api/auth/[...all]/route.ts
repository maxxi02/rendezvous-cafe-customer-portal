// app/api/auth/[...all]/route.ts  (in your Rendezvous project)
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
