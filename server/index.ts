import "dotenv/config";
import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { rateLimit } from "express-rate-limit";
import bcrypt from "bcryptjs";
import { randomBytes, createHash } from "node:crypto";
import path from "node:path";
import { z } from "zod";
import { pool } from "./db.js";
import { appointmentSchema, statuses } from "../shared/validation.js";

const app = express();
const production = process.env.NODE_ENV === "production";
const origin = process.env.APP_ORIGIN || "http://localhost:5173";
const cookieName = production ? "__Host-careflow" : "careflow";
const hash = (token: string) =>
  createHash("sha256").update(token).digest("hex");
if (process.env.TRUST_PROXY === "1") app.set("trust proxy", 1);
app.disable("x-powered-by");
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        "script-src": ["'self'"],
        "img-src": ["'self'", "data:"],
        "upgrade-insecure-requests": production ? [] : null,
      },
    },
  }),
);
app.use(express.json({ limit: "16kb" }));
app.use(cookieParser());
app.use("/api", (_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});
app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60_000,
    limit: 300,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { message: "Too many requests. Please try again shortly." },
  }),
);
// Same-origin writes protect cookie sessions against CSRF. API clients must also supply Origin.
app.use("/api", (req, res, next) => {
  if (
    !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
    req.headers.origin !== origin
  ) {
    res.status(403).json({ message: "Request origin is not allowed." });
    return;
  }
  next();
});
const authLimit = rateLimit({
  windowMs: 15 * 60_000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { message: "Too many login attempts. Try again in 15 minutes." },
});
const bookingLimit = rateLimit({
  windowMs: 60 * 60_000,
  limit: 8,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { message: "Booking limit reached. Please try again in an hour." },
});
const requireAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const token = req.cookies[cookieName];
  if (typeof token !== "string") {
    res.status(401).json({ message: "Please sign in to continue." });
    return;
  }
  const result = await pool.query(
    "SELECT a.id,a.name,a.email,a.role FROM sessions s JOIN admins a ON a.id=s.admin_id WHERE s.token_hash=$1 AND s.expires_at>NOW() AND a.role=$2",
    [hash(token), "admin"],
  );
  if (!result.rows[0]) {
    res
      .status(401)
      .json({ message: "Your session expired. Please sign in again." });
    return;
  }
  res.locals.admin = result.rows[0];
  next();
};
const fields = `id,name,email,phone,department,description,starts_at AS "startsAt",ends_at AS "endsAt",status,created_at AS "createdAt"`;
app.get("/api/health", async (_req, res) => {
  await pool.query("SELECT 1");
  res.json({ status: "ok" });
});
app.post("/api/auth/login", authLimit, async (req, res) => {
  const body = z
    .object({ email: z.email().max(254), password: z.string().min(1).max(72) })
    .strict()
    .parse(req.body);
  const result = await pool.query("SELECT * FROM admins WHERE email=$1", [
    body.email.toLowerCase(),
  ]);
  const admin = result.rows[0];
  // A real dummy hash keeps nonexistent accounts on the password verification path.
  const valid = await bcrypt.compare(
    body.password,
    admin?.password_hash ||
      "$2b$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW",
  );
  if (!admin || !valid) {
    res.status(401).json({ message: "Email or password is incorrect." });
    return;
  }
  const token = randomBytes(32).toString("hex");
  await pool.query("DELETE FROM sessions WHERE expires_at<=NOW()");
  await pool.query(
    "INSERT INTO sessions(token_hash,admin_id,expires_at) VALUES ($1,$2,NOW()+INTERVAL '8 hours')",
    [hash(token), admin.id],
  );
  res.cookie(cookieName, token, {
    httpOnly: true,
    secure: production,
    sameSite: "strict",
    path: "/",
    maxAge: 8 * 60 * 60_000,
  });
  res.json({
    id: admin.id,
    name: admin.name,
    email: admin.email,
    role: admin.role,
  });
});
app.get("/api/auth/me", requireAdmin, (_req, res) =>
  res.json(res.locals.admin),
);
app.post("/api/auth/logout", async (req, res) => {
  const token = req.cookies[cookieName];
  if (typeof token === "string")
    await pool.query("DELETE FROM sessions WHERE token_hash=$1", [hash(token)]);
  res.clearCookie(cookieName, {
    httpOnly: true,
    secure: production,
    sameSite: "strict",
    path: "/",
  });
  res.json({ success: true });
});
app.post("/api/appointments", bookingLimit, async (req, res) => {
  const data = appointmentSchema.parse(req.body);
  const result = await pool.query(
    `INSERT INTO appointments (name,email,phone,department,description,starts_at,ends_at) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
    [
      data.name,
      data.email.toLowerCase(),
      data.phone,
      data.department,
      data.description,
      data.startsAt,
      data.endsAt,
    ],
  );
  res
    .status(201)
    .json({
      id: result.rows[0].id,
      message:
        "Appointment request received. Our team will contact you to confirm.",
    });
});
app.get("/api/appointments", requireAdmin, async (_req, res) => {
  const result = await pool.query(
    `SELECT ${fields} FROM appointments ORDER BY starts_at DESC`,
  );
  res.json(result.rows);
});
app.patch("/api/appointments/:id", requireAdmin, async (req, res) => {
  const id = z.uuid().parse(req.params.id);
  const data = z
    .union([z.object({ status: z.enum(statuses) }).strict(), appointmentSchema])
    .parse(req.body);
  const result =
    "status" in data
      ? await pool.query(
          `UPDATE appointments SET status=$1 WHERE id=$2 RETURNING ${fields}`,
          [data.status, id],
        )
      : await pool.query(
          `UPDATE appointments SET name=$1,email=$2,phone=$3,department=$4,description=$5,starts_at=$6,ends_at=$7 WHERE id=$8 RETURNING ${fields}`,
          [
            data.name,
            data.email.toLowerCase(),
            data.phone,
            data.department,
            data.description,
            data.startsAt,
            data.endsAt,
            id,
          ],
        );
  if (!result.rowCount) {
    res.status(404).json({ message: "Appointment not found." });
    return;
  }
  res.json(result.rows[0]);
});
app.delete("/api/appointments/:id", requireAdmin, async (req, res) => {
  const id = z.uuid().parse(req.params.id);
  const result = await pool.query("DELETE FROM appointments WHERE id=$1", [id]);
  if (!result.rowCount) {
    res.status(404).json({ message: "Appointment not found." });
    return;
  }
  res.json({ success: true });
});
app.use("/api", (_req, res) =>
  res.status(404).json({ message: "Endpoint not found." }),
);
if (production) {
  app.use(express.static(path.resolve("dist")));
  app.get("/{*path}", (_req, res) =>
    res.sendFile(path.resolve("dist/index.html")),
  );
}
app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof z.ZodError) {
    res
      .status(400)
      .json({
        message: error.issues[0]?.message || "Invalid input",
        errors: error.flatten(),
      });
    return;
  }
  if (error instanceof SyntaxError) {
    res.status(400).json({ message: "Invalid JSON request." });
    return;
  }
  console.error(
    "Request failed:",
    error instanceof Error ? error.message : "Unknown error",
  );
  res
    .status(503)
    .json({ message: "Service temporarily unavailable. Please try again." });
});
const server = app.listen(Number(process.env.PORT || 4000), () =>
  console.log("Careflow API listening on port " + (process.env.PORT || 4000)),
);
const shutdown = () => {
  server.close(() => {
    void pool.end().then(() => process.exit(0));
  });
};
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
