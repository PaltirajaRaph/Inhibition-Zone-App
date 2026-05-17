import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
const app = new Hono();


app.use('*', logger(console.log));


app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);


app.get("/make-server-f351744e/health", (c) => {
  return c.json({ status: "ok" });
});

Deno.serve(app.fetch);