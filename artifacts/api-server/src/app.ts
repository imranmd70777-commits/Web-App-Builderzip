import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import path from "path";
import fs from "fs";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

// In production the frontend and backend share the same origin, so CORS is only
// needed in development (or when ALLOWED_ORIGIN is explicitly set for a split-
// host setup).
const rawOrigins = process.env["ALLOWED_ORIGIN"];
const allowedOrigins = rawOrigins
  ? rawOrigins.split(",").map(o => o.trim()).filter(Boolean)
  : null;

app.use(cors({
  origin: allowedOrigins
    ? (origin, cb) => {
        if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
        cb(new Error(`CORS: origin ${origin} not allowed`));
      }
    : "*",
  credentials: true,
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// API routes (always registered first so they always take priority)
app.use("/api", router);

// ─── Serve the React SPA in production ───────────────────────────────────────
// When NODE_ENV=production the Express server also serves the Vite-built
// frontend. The static files live two levels up from this built file:
//   artifacts/api-server/dist/index.mjs  →  __dirname
//   artifacts/mcq-platform/dist          →  ../../mcq-platform/dist
const isProd = process.env["NODE_ENV"] === "production";
if (isProd) {
  // Resolve relative to CWD (repo root) so it works whether you run via
  // `node artifacts/api-server/dist/index.mjs` or from within that folder.
  const staticDir = path.resolve(process.cwd(), "artifacts/mcq-platform/dist");

  if (fs.existsSync(staticDir)) {
    // Serve hashed assets with long-lived cache headers
    app.use(
      "/assets",
      express.static(path.join(staticDir, "assets"), {
        maxAge: "1y",
        immutable: true,
      }),
    );

    // Serve all other static files (favicon, robots.txt, etc.)
    app.use(express.static(staticDir, { maxAge: "0" }));

    // SPA fallback — every non-API path returns index.html
    app.get("*", (_req, res) => {
      res.sendFile(path.join(staticDir, "index.html"));
    });

    logger.info({ staticDir }, "Serving React SPA from static directory");
  } else {
    logger.warn({ staticDir }, "Static directory not found — frontend not served");
  }
}

export default app;
