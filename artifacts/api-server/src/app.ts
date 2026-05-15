import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
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
// In production, restrict CORS to the frontend origin.
// Set ALLOWED_ORIGIN env var on Render (e.g. https://yourdomain.com).
// Multiple origins can be comma-separated. Falls back to * in development.
const rawOrigins = process.env["ALLOWED_ORIGIN"];
const allowedOrigins = rawOrigins
  ? rawOrigins.split(",").map(o => o.trim()).filter(Boolean)
  : null;

app.use(cors({
  origin: allowedOrigins
    ? (origin, cb) => {
        // Allow requests with no origin (server-to-server, curl, etc.)
        if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
        cb(new Error(`CORS: origin ${origin} not allowed`));
      }
    : "*",
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
